# gaze_engine.py
# This is the main eye tracking engine for iComm

import cv2          # OpenCV - opens webcam and processes images
import mediapipe as mp   # Google's library for face landmark detection
import numpy as np  # Math library for calculations
import time         # For measuring how long a blink lasts

# MediaPipe Setup
# This loads the FaceMesh model into memory
mp_face_mesh = mp.solutions.face_mesh
mp_drawing   = mp.solutions.drawing_utils

# Create the FaceMesh detector
# refine_landmarks=True gives us precise iris positions 
# min_detection_confidence=0.5 means it only reports a face if 50%+ sure
face_mesh = mp_face_mesh.FaceMesh(
    max_num_faces=1,
    refine_landmarks=True,
    min_detection_confidence=0.5,
    min_tracking_confidence=0.5
)

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
        results = face_mesh.process(rgb_frame)

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
import json

class GazeSmoother:
    def __init__(self, alpha=0.2):
        self.alpha = alpha
        self.prev_x = None
        self.prev_y = None

    def smooth(self, x, y):
        if self.prev_x is None:
            self.prev_x = x
            self.prev_y = y
        else:
            self.prev_x = self.alpha * x + (1 - self.alpha) * self.prev_x
            self.prev_y = self.alpha * y + (1 - self.alpha) * self.prev_y

        return self.prev_x, self.prev_y

async def gaze_server(websocket):
    """
    WebSocket server that streams gaze data to the React frontend.
    The frontend connects to ws://localhost:8765 and receives JSON messages.
    """
    print('Frontend connected!')
    cap     = cv2.VideoCapture(0)
    smoother = GazeSmoother(alpha=0.2)
    blink_d  = BlinkDetector()

    
    # Load the calibration model
    try:
        model_x, model_y = load_gaze_model()
        calibrated = True
        print('Calibration model loaded.')
    except FileNotFoundError:
        calibrated = False
        print('No calibration found. Run calibration.py first.')
    
    '''
    calibrated = False  # For now, we won't use the gaze prediction model
    print ("Calibration disabled — gaze prediction will not work until you run calibration.py")
    '''

    while True:
        ret, frame = cap.read()
        if not ret: break

        frame = cv2.flip(frame, 1)
        rgb   = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = face_mesh.process(rgb)

        gaze_x, gaze_y, blink_type = 0, 0, None

        if results.multi_face_landmarks:
            lm   = results.multi_face_landmarks[0].landmark
            h, w = frame.shape[:2]

            # Get EAR for blink detection
            left_eye = np.array([[lm[i].x*w, lm[i].y*h] for i in LEFT_EYE])
            right_eye= np.array([[lm[i].x*w, lm[i].y*h] for i in RIGHT_EYE])
            ear = (calculate_ear(left_eye) + calculate_ear(right_eye)) / 2.0
            blink_type = blink_d.update(ear)

            # Get gaze prediction if calibrated
            if calibrated:
                features = get_gaze_features(lm, w, h)
                raw_x, raw_y = predict_gaze(model_x, model_y, features)
                gaze_x, gaze_y = smoother.update(raw_x, raw_y)

        # Send data to frontend as JSON
        message = json.dumps({
            'gaze_x':    gaze_x,
            'gaze_y':    gaze_y,
            'blink':     blink_type,   # 'short_blink', 'long_blink', or null
            'has_face':  results.multi_face_landmarks is not None
        })
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

def get_iris_center(landmarks, iris_indices, frame_w, frame_h):
    """
    Get the center (x, y) of an iris in pixel coordinates.
    MediaPipe gives us 4 points around each iris — we average them.
    """
    points = np.array([
        [landmarks[i].x * frame_w, landmarks[i].y * frame_h]
        for i in iris_indices
    ])
    center = points.mean(axis=0)   # Average of all 4 points
    return center   # Returns [x, y] in pixels

def get_gaze_features(landmarks, frame_w, frame_h):
    """
    Get the combined gaze feature vector for the ML model.
    We use both iris positions plus the head pose (nose tip position).
    This makes the model more robust to head movement.
    """
    left_iris  = get_iris_center(landmarks, LEFT_IRIS,  frame_w, frame_h)
    right_iris = get_iris_center(landmarks, RIGHT_IRIS, frame_w, frame_h)

    # Nose tip — landmark 1 — tells us head orientation
    nose_x = landmarks[1].x * frame_w
    nose_y = landmarks[1].y * frame_h

    # Normalize all values by frame size so they work across different resolutions
    features = [
        left_iris[0]  / frame_w,   # left iris x (0 to 1)
        left_iris[1]  / frame_h,   # left iris y (0 to 1)
        right_iris[0] / frame_w,   # right iris x (0 to 1)
        right_iris[1] / frame_h,   # right iris y (0 to 1)
        nose_x        / frame_w,   # nose x (0 to 1)
        nose_y        / frame_h,   # nose y (0 to 1)
    ]
    return features   # A list of 6 numbers


import joblib

def load_gaze_model(path='../data/gaze_model.pkl'):
    """Load the calibrated gaze model from disk."""
    data = joblib.load(path)
    return data['model_x'], data['model_y']

def predict_gaze(model_x, model_y, features):
    """
    Predict where on screen the user is looking.
    Input:  6-feature vector from get_gaze_features()
    Output: (screen_x, screen_y) in pixels
    """
    X = np.array(features).reshape(1, -1)   # Model expects 2D array
    screen_x = model_x.predict(X)[0]
    screen_y = model_y.predict(X)[0]
    return int(screen_x), int(screen_y)


class GazeSmoother:
    def __init__(self, alpha=0.2):
        """
        alpha: smoothing factor
          - Lower alpha (e.g. 0.1) = smoother but more lag
          - Higher alpha (e.g. 0.4) = more responsive but shakier
          0.2 is a good starting point
        """
        self.alpha   = alpha
        self.smooth_x = None
        self.smooth_y = None

    def update(self, raw_x, raw_y):
        """
        Call this every frame with the raw gaze prediction.
        Returns the smoothed (x, y) position.
        """
        if self.smooth_x is None:
            # First frame — no previous position yet, use raw position
            self.smooth_x = raw_x
            self.smooth_y = raw_y
        else:
            # Blend new position with previous smoothed position
            self.smooth_x = self.alpha * raw_x + (1 - self.alpha) * self.smooth_x
            self.smooth_y = self.alpha * raw_y + (1 - self.alpha) * self.smooth_y

        return int(self.smooth_x), int(self.smooth_y)

    def reset(self):
        """Call this if user looks away and comes back — avoids slow drift back"""
        self.smooth_x = None
        self.smooth_y = None
