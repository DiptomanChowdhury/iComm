# gaze_engine.py
# This is the main eye tracking engine for iComm

import cv2
import json
import joblib
import numpy as np
import time
from pathlib import Path

MODEL_URL = (
    'https://storage.googleapis.com/mediapipe-models/face_landmarker/'
    'face_landmarker/float16/1/face_landmarker.task'
)
MODEL_PATH = Path(__file__).resolve().parent / 'models' / 'face_landmarker.task'

_face_landmarker = None


def ensure_face_landmarker_model():
    """Download the Face Landmarker model if missing."""
    if MODEL_PATH.exists():
        return str(MODEL_PATH)

    MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)
    print(f'Downloading face landmarker model to {MODEL_PATH} ...')
    import urllib.request
    urllib.request.urlretrieve(MODEL_URL, MODEL_PATH)
    print('Model download complete.')
    return str(MODEL_PATH)


class FaceLandmarkerProcessor:
    """MediaPipe Tasks API wrapper (replaces removed mp.solutions.face_mesh)."""

    def __init__(self):
        import mediapipe as mp
        from mediapipe.tasks import python as mp_tasks
        from mediapipe.tasks.python import vision

        options = vision.FaceLandmarkerOptions(
            base_options=mp_tasks.BaseOptions(model_asset_path=ensure_face_landmarker_model()),
            running_mode=vision.RunningMode.VIDEO,
            num_faces=1,
            min_face_detection_confidence=0.5,
            min_face_presence_confidence=0.5,
            min_tracking_confidence=0.5,
        )
        self._mp = mp
        self._landmarker = vision.FaceLandmarker.create_from_options(options)
        self._timestamp_ms = 0

    def process(self, rgb_frame):
        """Process an RGB numpy frame; returns a FaceLandmarkerResult."""
        self._timestamp_ms += 33
        mp_image = self._mp.Image(
            image_format=self._mp.ImageFormat.SRGB,
            data=np.ascontiguousarray(rgb_frame),
        )
        return self._landmarker.detect_for_video(mp_image, self._timestamp_ms)

    def close(self):
        self._landmarker.close()


def get_face_landmarker():
    """Lazy-load Face Landmarker (MediaPipe Tasks API)."""
    global _face_landmarker
    if _face_landmarker is None:
        _face_landmarker = FaceLandmarkerProcessor()
    return _face_landmarker


# Backwards-compatible alias used by calibration.py
get_face_mesh = get_face_landmarker

# These are the index numbers of the landmarks around each eye.
# Think of them as seat numbers in a stadium — each number is always the same seat.

# Left eye landmarks (6 points)
LEFT_EYE  = [33, 160, 158, 133, 153, 144]

# Right eye landmarks (6 points)
RIGHT_EYE = [362, 385, 387, 263, 373, 380]

# Iris landmarks (the centre of each eye — added by refine_landmarks=True)
LEFT_IRIS  = [474, 475, 476, 477]   # 4 points forming a circle on left iris
RIGHT_IRIS = [469, 470, 471, 472]   # 4 points forming a circle on right iris

def calculate_ear(eye_landmarks):
    """
    Calculate Eye Aspect Ratio (EAR).    
    Input:  6 (x, y) points around an eye
    Output: A float between 0 (closed) and ~0.35 (wide open)
    """
    # Vertical distances 
    # We measure two vertical chords of the eye oval
    A = np.linalg.norm(eye_landmarks[1] - eye_landmarks[5])  # top-left to bottom-left
    B = np.linalg.norm(eye_landmarks[2] - eye_landmarks[4])  # top-right to bottom-right

    # Horizontal distance 
    C = np.linalg.norm(eye_landmarks[0] - eye_landmarks[3])  # corner to corner

    # EAR formula 

    ear = (A + B) / (2.0 * C)
    return ear

class BlinkDetector:
    def __init__(self):
        self.EAR_THRESHOLD    = 0.20   # Below this = eye is closing
        self.BLINK_FRAMES     = 4      # Must be closed for 4+ frames = deliberate blink
        self.LONG_BLINK_MS    = 600    # Closed for 600ms+ = long blink (cancel action)
        self.DWELL_BLINK_MS   = 150    # Closed for 150-600ms = normal click blink

        self.eye_closed_frames = 0     # Counter: how many frames has eye been closed?
        self.eye_close_time    = None  # Timestamp: when did eye start closing?
        self.last_blink_type   = None  # 'short', 'long', or None

    def update(self, ear):
        """
        Call this every frame with the current EAR value.
        Returns: 'short_blink', 'long_blink', or None
        """
        self.last_blink_type = None

        if ear < self.EAR_THRESHOLD:
            # Eye is closing this frame
            if self.eye_close_time is None:
                self.eye_close_time = time.time()  # Record when closing started
            self.eye_closed_frames += 1

        else:
            # Eye just opened — check if we had a blink
            if self.eye_closed_frames >= self.BLINK_FRAMES and self.eye_close_time:
                duration_ms = (time.time() - self.eye_close_time) * 1000

                if duration_ms >= self.LONG_BLINK_MS:
                    self.last_blink_type = 'long_blink'    # Cancel / go back
                elif duration_ms >= self.DWELL_BLINK_MS:
                    self.last_blink_type = 'short_blink'   # Select / click

            # Reset counters
            self.eye_closed_frames = 0
            self.eye_close_time    = None

        return self.last_blink_type


"""
def run_tracker():
    [
    Main loop: opens webcam, processes each frame, prints blink events.
    Press Q to quit.
    ]
    cap = cv2.VideoCapture(0)   # 0 = first webcam on your computer
    blink_detector = BlinkDetector()

    print('iComm Eye Tracker running. Press Q to quit.')

    while True:
        ret, frame = cap.read()   # Read one frame from webcam
        if not ret:
            print('Cannot read webcam. Check it is connected.')
            break

        # Flip horizontally so it feels like a mirror (more natural)
        frame = cv2.flip(frame, 1)

        # Convert frame from BGR (OpenCV format) to RGB (MediaPipe format)
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

        # Run FaceMesh on this frame — get all 468 landmarks
        results = get_face_mesh().process(rgb_frame)

        if results.multi_face_landmarks:
            # At least one face detected — get the first one
            landmarks = results.multi_face_landmarks[0].landmark

            # Get frame dimensions so we can convert from 0-1 range to pixels
            h, w = frame.shape[:2]

            # Extract left eye landmarks as (x, y) pixel coordinates
            left_eye = np.array([
                [landmarks[i].x * w, landmarks[i].y * h]
                for i in LEFT_EYE
            ])

            # Extract right eye landmarks
            right_eye = np.array([
                [landmarks[i].x * w, landmarks[i].y * h]
                for i in RIGHT_EYE
            ])

            # Calculate EAR for each eye, then average them
            left_ear  = calculate_ear(left_eye)
            right_ear = calculate_ear(right_eye)
            avg_ear   = (left_ear + right_ear) / 2.0

            # Detect blink
            blink = blink_detector.update(avg_ear)
            if blink == 'short_blink':
                print('SHORT BLINK DETECTED — this will be a click/select')
            elif blink == 'long_blink':
                print('LONG BLINK DETECTED — this will be cancel/back')

            # Draw EAR value on the webcam preview window
            cv2.putText(frame, f'EAR: {avg_ear:.3f}', (30, 40),
                        cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)

        # Show the webcam feed in a window
        cv2.imshow('iComm - Eye Tracker', frame)

        # Press Q to quit
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    cap.release()
    cv2.destroyAllWindows() 
    
"""

import asyncio
import websockets

def build_gaze_payload(gaze_x, gaze_y, blink_type, has_face):
    """
    WebSocket message shape expected by frontend useGaze.js.
    Keys must be gazex / gazey / hasface (not gaze_x / has_face).
    """
    return {
        'gazex': int(gaze_x),
        'gazey': int(gaze_y),
        'blink': blink_type,
        'hasface': bool(has_face),
    }

def get_iris_center(landmarks, iris_indices, frame_w, frame_h):
    """
    Get the center (x, y) of an iris in pixel coordinates.
    MediaPipe gives us 4 points around each iris — we average them.
    """
    points = np.array([
        [landmarks[i].x * frame_w, landmarks[i].y * frame_h]
        for i in iris_indices
    ])
    center = points.mean(axis=0)
    return center

def get_gaze_features(landmarks, frame_w, frame_h):
    """
    Get the combined gaze feature vector for the ML model.
    We use both iris positions plus the head pose (nose tip position).
    """
    left_iris  = get_iris_center(landmarks, LEFT_IRIS,  frame_w, frame_h)
    right_iris = get_iris_center(landmarks, RIGHT_IRIS, frame_w, frame_h)

    nose_x = landmarks[1].x * frame_w
    nose_y = landmarks[1].y * frame_h

    return [
        left_iris[0]  / frame_w,
        left_iris[1]  / frame_h,
        right_iris[0] / frame_w,
        right_iris[1] / frame_h,
        nose_x        / frame_w,
        nose_y        / frame_h,
    ]

def load_gaze_model(path=None):
    """Load the calibrated gaze model from disk."""
    if path is None:
        path = Path(__file__).resolve().parent.parent / 'data' / 'gaze_model.pkl'
    data = joblib.load(path)
    return data['model_x'], data['model_y']

def predict_gaze(model_x, model_y, features):
    """Predict screen (x, y) in pixels from a 6-feature eye vector."""
    X = np.array(features).reshape(1, -1)
    screen_x = model_x.predict(X)[0]
    screen_y = model_y.predict(X)[0]
    return int(screen_x), int(screen_y)

class GazeSmoother:
    def __init__(self, alpha=0.2):
        self.alpha = alpha
        self.smooth_x = None
        self.smooth_y = None

    def update(self, raw_x, raw_y):
        if self.smooth_x is None:
            self.smooth_x = raw_x
            self.smooth_y = raw_y
        else:
            self.smooth_x = self.alpha * raw_x + (1 - self.alpha) * self.smooth_x
            self.smooth_y = self.alpha * raw_y + (1 - self.alpha) * self.smooth_y
        return int(self.smooth_x), int(self.smooth_y)

    def reset(self):
        self.smooth_x = None
        self.smooth_y = None

async def gaze_server(websocket):
    """
    WebSocket server that streams gaze data to the React frontend.
    The frontend connects to ws://localhost:8765 and receives JSON messages.
    """
    print('Frontend connected!')
    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        print('ERROR: Cannot open webcam. Check connection and camera permissions.')
        return

    smoother = GazeSmoother(alpha=0.2)
    blink_d = BlinkDetector()

    try:
        model_x, model_y = load_gaze_model()
        calibrated = True
        print('Calibration model loaded.')
    except (FileNotFoundError, OSError, KeyError, ValueError) as err:
        calibrated = False
        model_x = model_y = None
        print(f'No calibration model ({err}). Blink detection still works; run calibration.py for gaze.')
    
    '''
    calibrated = False  # For now, we won't use the gaze prediction model
    print ("Calibration disabled — gaze prediction will not work until you run calibration.py")
    '''

    while True:
        ret, frame = cap.read()
        if not ret:
            await asyncio.sleep(0.01)
            continue

        frame = cv2.flip(frame, 1)
        rgb   = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        result = get_face_landmarker().process(rgb)

        gaze_x, gaze_y, blink_type = 0, 0, None
        has_face = bool(result.face_landmarks)

        if has_face:
            lm = result.face_landmarks[0]
            h, w = frame.shape[:2]

            left_eye = np.array([[lm[i].x * w, lm[i].y * h] for i in LEFT_EYE])
            right_eye = np.array([[lm[i].x * w, lm[i].y * h] for i in RIGHT_EYE])
            ear = (calculate_ear(left_eye) + calculate_ear(right_eye)) / 2.0
            blink_type = blink_d.update(ear)

            if calibrated:
                features = get_gaze_features(lm, w, h)
                raw_x, raw_y = predict_gaze(model_x, model_y, features)
                gaze_x, gaze_y = smoother.update(raw_x, raw_y)

        message = json.dumps(build_gaze_payload(gaze_x, gaze_y, blink_type, has_face))
        try:
            await websocket.send(message)
        except websockets.exceptions.ConnectionClosed:
            break

    cap.release()

# Start the WebSocket server
async def main():
    async with websockets.serve(gaze_server, 'localhost', 8765):
        print('Gaze engine running on ws://localhost:8765')
        await asyncio.Future()  # Run forever

if __name__ == '__main__':
    asyncio.run(main())

"""
# Run the tracker when you execute this file directly
if __name__ == '__main__':
    run_tracker()
"""

