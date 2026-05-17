#!/usr/bin/env python3
"""
End-to-end integration test for iComm.

Starts all backend services and the frontend dev server,
then runs Playwright scripts to verify the full pipeline.

Usage:
    python scripts/with_server.py \
      --server "uvicorn alert_service:app --port 8000" --port 8000 \
      --server "python gaze_engine.py" --port 8765 \
      --server "npm run dev" --port 5173 \
      --timeout 60 \
      -- python test/integration/e2e_alert_flow.py
"""

import json
import os
import sys
import time
from pathlib import Path

import requests
import websockets.sync.client as ws_client

BACKEND_DIR = Path(__file__).resolve().parent.parent.parent / 'Backend'
sys.path.insert(0, str(BACKEND_DIR))
os.environ['ICOMM_DEV_MODE'] = 'true'

ALERT_URL = os.environ.get('ALERT_URL', 'http://localhost:8000')
GAZE_WS_URL = os.environ.get('GAZE_WS_URL', 'ws://localhost:8765')
FRONTEND_URL = os.environ.get('FRONTEND_URL', 'http://localhost:5173')
TIMEOUT = int(os.environ.get('TEST_TIMEOUT', '30'))


def test_backend_health():
    print('\n[1/5] Checking backend health...')
    deadline = time.time() + TIMEOUT
    while time.time() < deadline:
        try:
            r = requests.get(f'{ALERT_URL}/health', timeout=3)
            if r.status_code == 200:
                data = r.json()
                assert data['status'] == 'ok'
                print(f'  Health OK (dev_mode={data.get("dev_mode")})')
                return
        except requests.ConnectionError:
            time.sleep(0.5)
    raise RuntimeError('Backend did not become healthy')


def test_gaze_status_endpoint():
    print('\n[2/5] Checking gaze status endpoint...')
    r = requests.get(f'{ALERT_URL}/gaze/status', timeout=5)
    assert r.status_code == 200
    data = r.json()
    assert 'model_loaded' in data
    print(f'  Gaze status: model_loaded={data["model_loaded"]}')


def test_gaze_websocket_connects():
    print('\n[3/5] Connecting to gaze WebSocket...')
    deadline = time.time() + TIMEOUT
    connected = False
    while time.time() < deadline:
        try:
            with ws_client.connect(GAZE_WS_URL, timeout=5) as ws:
                msg = ws.recv(timeout=5)
                data = json.loads(msg)
                assert 'gazex' in data
                assert 'gazey' in data
                assert 'hasface' in data
                assert 'blink' in data
                print(f'  WebSocket message received: gazex={data["gazex"]}, gazey={data["gazey"]}, hasface={data["hasface"]}')
                connected = True
                break
        except (OSError, ConnectionRefusedError, TimeoutError):
            time.sleep(0.5)
    if not connected:
        raise RuntimeError('Could not connect to gaze WebSocket')


def test_send_alert_dev_mode():
    print('\n[4/5] Testing alert flow in dev mode...')
    r = requests.post(f'{ALERT_URL}/send-alert', timeout=5)
    assert r.status_code == 200
    data = r.json()
    assert data['status'] == 'dev'
    print(f'  Alert response: {data}')

    r2 = requests.post(f'{ALERT_URL}/send-caregiver-alert', json={'message': 'Integration test message'}, timeout=5)
    assert r2.status_code == 200
    print(f'  Caregiver alert: {r2.json()}')


def test_calibrate_done():
    print('\n[5/5] Testing calibration endpoint...')
    r = requests.post(f'{ALERT_URL}/calibrate-done', timeout=5)
    assert r.status_code == 200
    data = r.json()
    assert data['status'] == 'ok'
    print(f'  Calibration endpoint: {data}')


if __name__ == '__main__':
    errors = []
    tests = [
        test_backend_health,
        test_gaze_status_endpoint,
        test_gaze_websocket_connects,
        test_send_alert_dev_mode,
        test_calibrate_done,
    ]

    for test in tests:
        try:
            test()
            print(f'  PASS')
        except Exception as e:
            print(f'  FAIL: {e}')
            errors.append(f'{test.__name__}: {e}')

    if errors:
        print(f'\nFAILURES ({len(errors)}):')
        for e in errors:
            print(f'  - {e}')
        sys.exit(1)
    else:
        print('\nAll integration tests passed!')
