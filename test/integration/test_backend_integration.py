import asyncio
import json
import sys
from pathlib import Path

import pytest
import websockets
from fastapi.testclient import TestClient

BACKEND_DIR = Path(__file__).resolve().parent.parent.parent / 'Backend'
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

import alert_service
from alert_service import app, build_alert_message, set_twilio_client


@pytest.fixture
def client():
    return TestClient(app)


class TestAlertServiceIntegration:
    def test_health_and_gaze_status_endpoints(self, client):
        get_resp = client.get('/health')
        assert get_resp.status_code == 200
        assert get_resp.json()['status'] == 'ok'

        gaze_resp = client.get('/gaze/status')
        assert gaze_resp.status_code == 200
        assert 'model_loaded' in gaze_resp.json()

    def test_full_alert_flow_dev_mode(self, client):
        alert_service.DEV_MODE = True
        set_twilio_client(None)

        emergency_resp = client.post('/send-alert')
        assert emergency_resp.status_code == 200
        assert emergency_resp.json()['status'] == 'dev'

        caregiver_resp = client.post('/send-caregiver-alert', json={'message': 'Please check on me'})
        assert caregiver_resp.status_code == 200

        quick_resp = client.post('/send-quick-message', json={'message': 'I need water'})
        assert quick_resp.status_code == 200

    def test_calibrate_done_endpoint(self, client):
        resp = client.post('/calibrate-done')
        assert resp.status_code == 200
        data = resp.json()
        assert data['status'] == 'ok'
        assert 'model_loaded' in data


async def _wait_for_ws(uri, timeout=15):
    deadline = asyncio.get_event_loop().time() + timeout
    last_err = None
    while asyncio.get_event_loop().time() < deadline:
        try:
            return await websockets.connect(uri, open_timeout=5)
        except (OSError, TimeoutError, websockets.WebSocketException) as e:
            last_err = e
            await asyncio.sleep(0.5)
    raise TimeoutError(f'Could not connect to {uri}') from last_err


class TestGazeWebSocketIntegration:
    @pytest.mark.asyncio
    async def test_gaze_server_accepts_connection_and_sends_payload(self):
        import gaze_engine
        gaze_engine._gaze_hub._reload_gaze_model()

        async def run_server():
            async with websockets.serve(gaze_engine.gaze_server, 'localhost', 18765):
                await asyncio.Future()

        server_task = asyncio.create_task(run_server())
        await asyncio.sleep(1)

        ws = await _wait_for_ws('ws://localhost:18765', timeout=20)
        async with ws:
            msg = await asyncio.wait_for(ws.recv(), timeout=15)
            data = json.loads(msg)

            assert 'gazex' in data
            assert 'gazey' in data
            assert 'hasface' in data
            assert 'blink' in data
            assert 'screenw' in data
            assert 'screenh' in data
            assert 'model_ready' in data

        server_task.cancel()
        try:
            await server_task
        except (asyncio.CancelledError, websockets.exceptions.ConnectionClosed):
            pass

    @pytest.mark.asyncio
    async def test_gaze_websocket_echoes_calibration_commands(self):
        import gaze_engine
        gaze_engine._gaze_hub._reload_gaze_model()

        async def run_server():
            async with websockets.serve(gaze_engine.gaze_server, 'localhost', 18766):
                await asyncio.Future()

        server_task = asyncio.create_task(run_server())
        await asyncio.sleep(1)

        ws = await _wait_for_ws('ws://localhost:18766', timeout=20)
        async with ws:
            msg = await asyncio.wait_for(ws.recv(), timeout=15)
            first = json.loads(msg)
            assert 'gazex' in first

            await ws.send(json.dumps({'type': 'calib_start'}))
            await ws.send(json.dumps({
                'type': 'calib_point',
                'target_x': 960,
                'target_y': 540,
            }))

            calib_msg = await asyncio.wait_for(ws.recv(), timeout=15)
            calib_data = json.loads(calib_msg)
            if calib_data.get('calib_progress') is not None:
                assert calib_data['calib_point'] == 1
                assert calib_data['gazex'] == 960
                assert calib_data['gazey'] == 540

        server_task.cancel()
        try:
            await server_task
        except asyncio.CancelledError:
            pass
