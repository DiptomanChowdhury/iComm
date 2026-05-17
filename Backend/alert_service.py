# backend/alert_service.py
import datetime
import os
from pathlib import Path

from fastapi import FastAPI, HTTPException

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

_twilio_client = None


def get_twilio_client():
    """Return a Twilio client when credentials are configured."""
    global _twilio_client
    if _twilio_client is not None:
        return _twilio_client

    account_sid = os.environ.get('TWILIO_ACCOUNT_SID')
    auth_token = os.environ.get('TWILIO_AUTH_TOKEN')
    if not account_sid or not auth_token:
        return None

    from twilio.rest import Client
    _twilio_client = Client(account_sid, auth_token)
    return _twilio_client


def set_twilio_client(client):
    """Inject a mock client for tests."""
    global _twilio_client
    _twilio_client = client


def build_alert_message():
    timestamp = datetime.datetime.now().strftime('%I:%M %p on %B %d, %Y')
    return (
        f'🆘 GAZEGUARD EMERGENCY ALERT\n\n'
        f'Patient: {PATIENT_NAME}\n'
        f'Time: {timestamp}\n'
        f'Location: {PATIENT_ADDRESS}\n\n'
        f'Your patient needs immediate assistance. '
        f'Please check on them right away.'
    )


@app.post('/send-alert')
async def send_alert():
    """
    Called by the React frontend when the patient triggers the HELP button.
    Sends a WhatsApp message to the caregiver when Twilio is configured.
    """
    client = get_twilio_client()
    if client is None:
        raise HTTPException(
            status_code=503,
            detail='Twilio is not configured. Set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN.',
        )

    message = client.messages.create(
        body=build_alert_message(),
        from_=TWILIO_WHATSAPP_FROM,
        to=CAREGIVER_WHATSAPP,
    )

    return {'status': 'sent', 'sid': message.sid}


@app.get('/health')
async def health_check():
    return {'status': 'ok'}
