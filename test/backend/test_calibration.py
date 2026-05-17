"""Tests for calibration grid and Ridge training (no webcam required)."""

import numpy as np

from calibration import CALIBRATION_POINTS, SCREEN_H, SCREEN_W, train_gaze_model


class TestCalibrationGrid:
    def test_nine_point_grid(self):
        assert len(CALIBRATION_POINTS) == 9

    def test_corners_and_center_present(self):
        assert (0.15, 0.15) in CALIBRATION_POINTS
        assert (0.5, 0.5) in CALIBRATION_POINTS
        assert (0.85, 0.85) in CALIBRATION_POINTS

    def test_all_points_are_normalized_fractions(self):
        for x_frac, y_frac in CALIBRATION_POINTS:
            assert 0.0 <= x_frac <= 1.0
            assert 0.0 <= y_frac <= 1.0


class TestTrainGazeModel:
    def test_trains_on_synthetic_samples(self):
        features = []
        targets_x = []
        targets_y = []

        for dot_x_frac, dot_y_frac in CALIBRATION_POINTS:
            dot_x = int(dot_x_frac * SCREEN_W)
            dot_y = int(dot_y_frac * SCREEN_H)
            for _ in range(5):
                features.append([dot_x_frac, dot_y_frac, dot_x_frac + 0.01, dot_y_frac, 0.5, 0.5])
                targets_x.append(dot_x)
                targets_y.append(dot_y)

        model_x, model_y = train_gaze_model(features, targets_x, targets_y)
        sample = np.array([[0.5, 0.5, 0.51, 0.5, 0.5, 0.5]])
        pred_x = int(model_x.predict(sample)[0])
        pred_y = int(model_y.predict(sample)[0])
        center_x = int(0.5 * SCREEN_W)
        center_y = int(0.5 * SCREEN_H)

        assert abs(pred_x - center_x) < 200
        assert abs(pred_y - center_y) < 200
