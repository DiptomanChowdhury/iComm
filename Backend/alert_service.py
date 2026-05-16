# backend/alert_service.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
'''from twilio.rest import Client'''
import datetime

app = FastAPI()

# Allow the React frontend (running on localhost:3000) to call this API
app.add_middleware(CORSMiddleware,
    allow_origins=['*'],
    allow_methods=['*'],
    allow_headers=['*'],
)

'''
# --- Twilio Configuration ---
# Replace these with your actual values from twilio.com/console
TWILIO_ACCOUNT_SID  = 'ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'
TWILIO_AUTH_TOKEN   = 'your_auth_token_here'
TWILIO_WHATSAPP_NUM = 'whatsapp:+14155238886'  # Twilio sandbox number
CAREGIVER_PHONE     = 'whatsapp:+91XXXXXXXXXX' # Caregiver's WhatsApp number with country code
'''

from twilio.rest import Client

account_sid = 'ACaff435114e6d6c11ae7da173e295a959'
auth_token = 'a7f6cd8330790a907eaa9ce33a5527e6'
client = Client(account_sid, auth_token)

message = client.messages.create(
  from_='whatsapp:+14155238886',
  content_sid='HXb5b62575e6e4ff6129ad7c8efe1f983e',
  content_variables='{"1":"12/1","2":"3pm"}',
  to='whatsapp:+919874689851'
)

print(message.sid)

# --- Patient Configuration ---
PATIENT_NAME    = 'Patient Name'
PATIENT_ADDRESS = 'Patient Home Address Here'

client = Client('ACaff435114e6d6c11ae7da173e295a959', 'a7f6cd8330790a907eaa9ce33a5527e6')


@app.post('/send-alert')
async def send_alert():
    """
    Called by the React frontend when the patient triggers the HELP button.
    Sends a WhatsApp message to the caregiver immediately.
    """
    timestamp = datetime.datetime.now().strftime('%I:%M %p on %B %d, %Y')

    message_body = (
        f'🆘 GAZEGUARD EMERGENCY ALERT\n\n'
        f'Patient: {PATIENT_NAME}\n'
        f'Time: {timestamp}\n'
        f'Location: {PATIENT_ADDRESS}\n\n'
        f'Your patient needs immediate assistance. '
        f'Please check on them right away.'
    )

    # Send WhatsApp message
    message = client.messages.create(
        body=message_body,
        from_='whatsapp:+14155238886',
        to='whatsapp:+919874689851'
    )

    print(f'Alert sent! Message SID: {message.sid}')
    return { 'status': 'sent', 'sid': message.sid }


@app.get('/health')
async def health_check():
    """Simple check to confirm the server is running"""
    return { 'status': 'ok' }
