"""Unit tests for gaze_engine — EAR, blinks, smoothing, gaze model, WebSocket payload."""

import json
from types import SimpleNamespace
from unittest.mock import patch

import joblib
import numpy as np
import pytest
from sklearn.linear_model import Ridge

from gaze_engine import (
    LEFT_IRIS,
    RIGHT_IRIS,
    BlinkDetector,
    GazeSmoother,
    build_gaze_payload,
    calculate_ear,
    get_gaze_features,
    load_gaze_model,
    predict_gaze,
)


def _open_eye_landmarks():
    """Six points forming a wide-open eye (high EAR per Soukupova & Cech)."""
    return np.array([
        [0.0, 50.0],    # 0: left corner
        [40.0, 0.0],    # 1: upper lid left
        [80.0, 0.0],    # 2: upper lid right
        [120.0, 50.0],  # 3: right corner
        [80.0, 100.0],  # 4: lower lid right
        [40.0, 100.0],  # 5: lower lid left
    ], dtype=float)


def _closed_eye_landmarks():
    """Six points forming a nearly closed eye (low EAR)."""
    return np.array([
        [0.0, 50.0],
        [60.0, 48.0],
        [60.0, 52.0],
        [120.0, 50.0],
        [60.0, 51.0],
        [60.0, 49.0],
    ], dtype=float)


def _make_landmarks(frame_w=640, frame_h=480):
    """Minimal MediaPipe-like landmark list for feature extraction."""
    landmarks = [SimpleNamespace(x=0.0, y=0.0) for _ in range(478)]

    for idx in LEFT_IRIS:
        landmarks[idx].x = 0.30
        landmarks[idx].y = 0.40
    for idx in RIGHT_IRIS:
        landmarks[idx].x = 0.70
        landmarks[idx].y = 0.40
    landmarks[1].x = 0.50
    landmarks[1].y = 0.55
    return landmarks


class TestCalculateEar:
    def test_open_eye_has_higher_ear_than_closed(self):
        open_ear = calculate_ear(_open_eye_landmarks())
        closed_ear = calculate_ear(_closed_eye_landmarks())
        assert open_ear > closed_ear
        assert open_ear > 0.20
        assert closed_ear < 0.20


class TestBlinkDetector:
    def test_short_blink_after_deliberate_close(self):
        detector = BlinkDetector()
        clock = [0.0]

        with patch('gaze_engine.time.time', lambda: clock[0]):
            for _ in range(5):
                clock[0] += 0.05
                detector.update(0.10)
            clock[0] += 0.05
            result = detector.update(0.35)

        assert result == 'short_blink'

    def test_long_blink_when_held_closed(self):
        detector = BlinkDetector()
        clock = [0.0]

        with patch('gaze_engine.time.time', lambda: clock[0]):
            for _ in range(5):
                clock[0] += 0.15
                detector.update(0.10)
            clock[0] += 0.15
            result = detector.update(0.35)

        assert result == 'long_blink'

    def test_no_blink_on_brief_closure(self):
        detector = BlinkDetector()
        with patch('gaze_engine.time.time', return_value=0.0):
            for _ in range(2):
                detector.update(0.10)
            result = detector.update(0.35)
        assert result is None


class TestGazeSmoother:
    def test_first_frame_returns_raw_position(self):
        smoother = GazeSmoother(alpha=0.2)
        assert smoother.update(100, 200) == (100, 200)

    def test_second_frame_applies_exponential_smoothing(self):
        smoother = GazeSmoother(alpha=0.2)
        smoother.update(100, 100)
        x, y = smoother.update(200, 300)
        assert x == int(0.2 * 200 + 0.8 * 100)
        assert y == int(0.2 * 300 + 0.8 * 100)

    def test_reset_clears_state(self):
        smoother = GazeSmoother(alpha=0.2)
        smoother.update(50, 50)
        smoother.reset()
        assert smoother.update(80, 90) == (80, 90)


class TestGazeFeaturesAndModel:
    def test_get_gaze_features_returns_six_normalized_values(self):
        features = get_gaze_features(_make_landmarks(), 640, 480)
        assert len(features) == 6
        assert all(0.0 <= v <= 1.0 for v in features)

    def test_predict_gaze_with_trained_ridge_models(self):
        features = [0.3, 0.4, 0.7, 0.4, 0.5, 0.55]
        model_x = Ridge(alpha=1.0)
        model_y = Ridge(alpha=1.0)
        model_x.fit([features], [960])
        model_y.fit([features], [540])
        x, y = predict_gaze(model_x, model_y, features)
        assert x == 960
        assert y == 540

    def test_load_gaze_model_from_file(self, tmp_path):
        model_x = Ridge().fit([[0.1] * 6], [100])
        model_y = Ridge().fit([[0.1] * 6], [200])
        path = tmp_path / 'gaze_model.pkl'
        joblib.dump({'model_x': model_x, 'model_y': model_y}, path)

        loaded_x, loaded_y, sw, sh = load_gaze_model(path)
        x, y = predict_gaze(loaded_x, loaded_y, [0.1] * 6)
        assert x == 100
        assert y == 200
        assert sw == 1920
        assert sh == 1080


class TestWebSocketPayload:
    def test_build_gaze_payload_matches_frontend_contract(self):
        payload = build_gaze_payload(400, 300, 'short_blink', True, 1920, 1080)
        assert payload == {
            'gazex': 400,
            'gazey': 300,
            'screenw': 1920,
            'screenh': 1080,
            'blink': 'short_blink',
            'hasface': True,
        }

    def test_payload_serializes_to_json(self):
        raw = json.dumps(build_gaze_payload(0, 0, None, False))
        data = json.loads(raw)
        assert data['gazex'] == 0
        assert data['gazey'] == 0
        assert data['blink'] is None
        assert data['hasface'] is False
