# iComm (GazeGuard)

Eye-controlled assistive communication app: gaze tracking, on-screen keyboard, quick phrases, and caregiver alerts.

---

## Prerequisites

| Tool | Version | Notes |
|------|---------|--------|
| **Python** | 3.10 – 3.14 | Use a virtual environment (`venv` or `.venv`) |
| **Node.js** | LTS (18+) | For npm scripts and frontend tests |
| **Webcam** | — | Required for calibration and gaze engine |
| **Twilio** (optional) | — | Only for WhatsApp caregiver alerts |

---

## Project layout

```
iComm/
├── Backend/           # Python: gaze engine, calibration, alerts
├── src/               # React + Electron UI
├── test/
│   ├── backend/       # pytest
│   └── frontend/      # vitest
├── data/              # gaze_model.pkl (created by calibration)
├── scripts/           # venv-aware run helpers (Windows)
├── venv/              # Your Python virtual environment
└── package.json       # npm scripts
```

---

## One-time setup

### 1. Python virtual environment

```powershell
cd D:\Projects\iComm

# Create venv, install dependencies, download MediaPipe model
npm run setup:venv
```

Or manually:

```powershell
python -m venv venv
venv\Scripts\Activate.ps1
pip install -r Backend\requirements.txt
cd Backend
python -c "from gaze_engine import ensure_face_landmarker_model; ensure_face_landmarker_model()"
cd ..
```

### 2. Node dependencies

```powershell
npm install
```

### 3. Twilio alerts (optional)

```powershell
copy Backend\.env.example Backend\.env
# Edit Backend\.env with your Twilio Account SID, Auth Token, and phone numbers
```

---

## Run order (full system)

Start components in this order for a live session:

```
1. Calibrate (once, or when changing screen/user)
2. Gaze engine (WebSocket)
3. Alert API (if using HELP button)
4. Frontend (Electron app — when build tooling is configured)
```

---

## Components

### Calibration (one-time per user/screen)

Shows 9 green dots; saves `data/gaze_model.pkl`.

```powershell
venv\Scripts\Activate.ps1
npm run backend:calibrate
```

- Look at each dot until it advances.
- Edit `SCREEN_W` / `SCREEN_H` in `Backend/calibration.py` if they do not match your display.

---

### Gaze engine (eye tracking WebSocket)

Streams gaze position, blink events, and face detection to the UI.

```powershell
npm run backend:gaze
```

| | |
|---|---|
| **URL** | `ws://localhost:8765` |
| **Payload** | `gazex`, `gazey`, `blink`, `hasface` |

Manual equivalent:

```powershell
cd Backend
python gaze_engine.py
```

Works without calibration (blinks + face only). Gaze coordinates require a saved model.

---

### Alert service (caregiver WhatsApp)

Handles `POST /send-alert` from the HELP button in the UI.

```powershell
npm run backend:alert
```

| | |
|---|---|
| **Base URL** | `http://localhost:8000` |
| **Health** | `GET http://localhost:8000/health` |

Requires `Backend/.env` with valid Twilio credentials. Returns `503` if Twilio is not configured.

Manual equivalent:

```powershell
cd Backend
python -m uvicorn alert_service:app --reload --host 127.0.0.1 --port 8000
```

---

### Frontend (Electron + React)

The UI in `src/` connects to:

- Gaze: `ws://localhost:8765`
- Alerts: `http://localhost:8000/send-alert`

The Electron desktop shell (`src/main.js`) expects Electron Forge / webpack tooling that is not yet in `package.json`. Until that is added, run the **Python backends** above and wire the UI when the Electron dev script is available.

---

## Tests

All tests live under `test/`:

```powershell
# Everything
npm test

# Frontend only (49 tests)
npm run test:frontend

# Backend only (20 tests, no webcam)
npm run test:backend

# Frontend watch mode
npm run test:watch
```

With venv activated:

```powershell
python -m pytest test/backend
npx vitest run
```

---

## npm scripts reference

| Script | What it does |
|--------|----------------|
| `npm run setup:venv` | Create venv, install Python deps, download face model |
| `npm run backend:calibrate` | 9-point gaze calibration |
| `npm run backend:gaze` | Start WebSocket gaze server |
| `npm run backend:alert` | Start FastAPI alert API |
| `npm test` | Run frontend + backend tests |
| `npm run test:frontend` | Vitest |
| `npm run test:backend` | pytest |

npm scripts use `venv\Scripts\python.exe` when present, then `.venv`, then system Python.

---

## Environment variables

Set in `Backend/.env` (see `Backend/.env.example`):

| Variable | Purpose |
|----------|---------|
| `TWILIO_ACCOUNT_SID` | Twilio account |
| `TWILIO_AUTH_TOKEN` | Twilio secret |
| `TWILIO_WHATSAPP_FROM` | Sender WhatsApp number |
| `CAREGIVER_WHATSAPP` | Caregiver recipient |
| `PATIENT_NAME` | Included in alert text |
| `PATIENT_ADDRESS` | Included in alert text |

---

## Troubleshooting

**`module 'mediapipe' has no attribute 'solutions'`**  
MediaPipe 0.10.30+ removed the old API. This project uses the Tasks Face Landmarker. Ensure `Backend/models/face_landmarker.task` exists (run setup or the `ensure_face_landmarker_model()` one-liner above).

**Calibration opens but crashes on first dot**  
Allow camera access for Python/Terminal in Windows Settings. Confirm the model file downloaded successfully.

**Gaze cursor does not move in the UI**  
Run calibration first, then `backend:gaze`. Check that the frontend shows connected on `ws://localhost:8765`.

**HELP button does nothing**  
Start `backend:alert` and configure `Backend/.env`. Test with `curl http://localhost:8000/health`.

**npm scripts use wrong Python**  
Activate your venv first, or name the folder `venv` at the project root so `scripts/py.ps1` finds it.

---

## Ports summary

| Service | Port | Protocol |
|---------|------|----------|
| Gaze engine | 8765 | WebSocket |
| Alert API | 8000 | HTTP |

---

## Further reading

- `GazeGuard_Build_Guide.md` — full build guide and architecture background
