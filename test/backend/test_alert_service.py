"""Tests for FastAPI alert service (no real Twilio calls)."""

from unittest.mock import MagicMock

import pytest
from fastapi.testclient import TestClient

import alert_service
from alert_service import app, build_alert_message, set_twilio_client


@pytest.fixture
def client():
    return TestClient(app)


class TestHealthEndpoint:
    def test_health_returns_ok(self, client):
        response = client.get('/health')
        assert response.status_code == 200
        assert response.json() == {'status': 'ok'}


class TestSendAlertEndpoint:
    def test_returns_503_when_twilio_not_configured(self, client, monkeypatch):
        monkeypatch.delenv('TWILIO_ACCOUNT_SID', raising=False)
        monkeypatch.delenv('TWILIO_AUTH_TOKEN', raising=False)
        set_twilio_client(None)

        response = client.post('/send-alert')
        assert response.status_code == 503
        assert 'Twilio' in response.json()['detail']

    def test_sends_alert_when_twilio_client_is_mocked(self, client):
        mock_message = MagicMock()
        mock_message.sid = 'SM_TEST_123'
        mock_client = MagicMock()
        mock_client.messages.create.return_value = mock_message
        set_twilio_client(mock_client)

        response = client.post('/send-alert')
        assert response.status_code == 200
        body = response.json()
        assert body['status'] == 'sent'
        assert body['sid'] == 'SM_TEST_123'
        mock_client.messages.create.assert_called_once()

    def test_alert_message_includes_patient_fields(self, monkeypatch):
        monkeypatch.setattr(alert_service, 'PATIENT_NAME', 'Test Patient')
        monkeypatch.setattr(alert_service, 'PATIENT_ADDRESS', '123 Test St')
        message = build_alert_message()
        assert 'Test Patient' in message
        assert '123 Test St' in message
        assert 'GAZEGUARD EMERGENCY ALERT' in message
