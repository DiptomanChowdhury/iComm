# backend/alert_service.py
import datetime
import os
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

try:
    from dotenv import load_dotenv
    load_dotenv(Path(__file__).resolve().parent / '.env')
    load_dotenv(Path(__file__).resolve().parent.parent / '.env')
except ImportError:
    pass
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_methods=['*'],
    allow_headers=['*'],
)

PATIENT_NAME = os.environ.get('PATIENT_NAME', 'Patient Name')
PATIENT_ADDRESS = os.environ.get('PATIENT_ADDRESS', 'Patient Home Address Here')
TWILIO_WHATSAPP_FROM = os.environ.get('TWILIO_WHATSAPP_FROM', 'whatsapp:+14155238886')
CAREGIVER_WHATSAPP = os.environ.get('CAREGIVER_WHATSAPP', 'whatsapp:+919874689851')
DEV_MODE = os.environ.get('ICOMM_DEV_MODE', 'true').lower() in ('1', 'true', 'yes')

_twilio_client = None
_twilio_disabled = False


class AlertBody(BaseModel):
    phone: Optional[str] = None
    message: Optional[str] = None


def get_twilio_client():
    """Return a Twilio client when credentials are configured."""
    global _twilio_client
    if _twilio_disabled:
        return None
    if _twilio_client is not None:
        return _twilio_client

    account_sid = os.environ.get('TWILIO_ACCOUNT_SID', '').strip()
    auth_token = os.environ.get('TWILIO_AUTH_TOKEN', '').strip()
    if not account_sid or not auth_token or 'your_' in account_sid or 'your_' in auth_token:
        return None

    from twilio.rest import Client
    _twilio_client = Client(account_sid, auth_token)
    return _twilio_client


def set_twilio_client(client):
    """Inject a mock client for tests (None disables Twilio for this process)."""
    global _twilio_client, _twilio_disabled
    _twilio_client = client
    _twilio_disabled = client is None


def build_alert_message(extra: str = ''):
    timestamp = datetime.datetime.now().strftime('%I:%M %p on %B %d, %Y')
    body = (
        f'🆘 GAZEGUARD EMERGENCY ALERT\n\n'
        f'Patient: {PATIENT_NAME}\n'
        f'Time: {timestamp}\n'
        f'Location: {PATIENT_ADDRESS}\n\n'
        f'Your patient needs immediate assistance. '
        f'Please check on them right away.'
    )
    if extra:
        body += f'\n\nMessage: {extra}'
    return body


def send_whatsapp(body: str, to_number: Optional[str] = None):
    """Send via Twilio, or log in dev mode when Twilio is not configured."""
    to = to_number or CAREGIVER_WHATSAPP
    client = get_twilio_client()
    if client is None:
        if DEV_MODE:
            print(f'[iComm DEV] WhatsApp to {to}:\n{body}\n')
            return {'status': 'dev', 'detail': 'Logged locally (Twilio not configured)'}
        raise HTTPException(
            status_code=503,
            detail='Twilio is not configured. Set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN.',
        )

    try:
        message = client.messages.create(
            body=body,
            from_=TWILIO_WHATSAPP_FROM,
            to=to,
        )
        return {'status': 'sent', 'sid': message.sid}
    except Exception as e:
        error_body = str(e)
        raise HTTPException(
            status_code=502,
            detail=f'Twilio API error: {error_body}',
        )


@app.post('/send-alert')
async def send_alert(body: Optional[AlertBody] = None):
    """Emergency alert to caregiver."""
    extra = body.message if body and body.message else ''
    return send_whatsapp(build_alert_message(extra), body.phone if body else None)


@app.post('/send-caregiver-alert')
async def send_caregiver_alert(body: Optional[AlertBody] = None):
    """Notify caregiver with optional composed message."""
    text = body.message if body and body.message else 'Your patient needs assistance.'
    msg = (
        f'📢 GAZEGUARD CAREGIVER ALERT\n\n'
        f'Patient: {PATIENT_NAME}\n'
        f'Time: {datetime.datetime.now().strftime("%I:%M %p")}\n\n'
        f'{text}'
    )
    return send_whatsapp(msg, body.phone if body else None)


@app.post('/send-quick-message')
async def send_quick_message(body: Optional[AlertBody] = None):
    """Send a preset quick message."""
    text = (body.message if body and body.message else '').strip() or 'Quick message from patient.'
    msg = (
        f'💬 GAZEGUARD QUICK MESSAGE\n\n'
        f'Patient: {PATIENT_NAME}\n\n'
        f'{text}'
    )
    return send_whatsapp(msg, body.phone if body else None)


@app.post('/calibrate-done')
async def calibrate_done():
    """Acknowledge UI calibration flow (ML training is via WebSocket or calibration.py)."""
    return {'status': 'ok', 'model_loaded': _gaze_model_exists()}


@app.get('/gaze/status')
async def gaze_status():
    """Report whether a trained gaze model exists on disk."""
    path = Path(__file__).resolve().parent.parent / 'data' / 'gaze_model.pkl'
    if not path.exists():
        return {'model_loaded': False, 'screen_w': None, 'screen_h': None}
    try:
        import joblib
        data = joblib.load(path)
        return {
            'model_loaded': True,
            'screen_w': data.get('screen_w'),
            'screen_h': data.get('screen_h'),
        }
    except Exception:
        return {'model_loaded': False, 'screen_w': None, 'screen_h': None}


def _gaze_model_exists():
    return (Path(__file__).resolve().parent.parent / 'data' / 'gaze_model.pkl').exists()


@app.get('/health')
async def health_check():
    return {'status': 'ok', 'dev_mode': DEV_MODE}
