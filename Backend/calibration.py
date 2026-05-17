# calibration.py
import cv2
import numpy as np
import time
import joblib
from sklearn.linear_model import Ridge
from gaze_engine import face_mesh, LEFT_IRIS, RIGHT_IRIS, get_gaze_features

# The 9 calibration dot positions as fractions of screen size
# (0.1, 0.1) = top left corner, (0.9, 0.9) = bottom right corner
CALIBRATION_POINTS = [
    (0.1, 0.1), (0.5, 0.1), (0.9, 0.1),   # Top row
    (0.1, 0.5), (0.5, 0.5), (0.9, 0.5),   # Middle row
    (0.1, 0.9), (0.5, 0.9), (0.9, 0.9),   # Bottom row
]

SCREEN_W = 1920   # Change to your screen width
SCREEN_H = 1080   # Change to your screen height
SAMPLES_PER_POINT = 30  # Collect 30 frames per dot = 30 training samples per point


def run_calibration():
    """
    Shows 9 dots on screen. User looks at each one for 2 seconds.
    Saves calibration model to data/gaze_model.pkl
    """
    cap = cv2.VideoCapture(0)
    cap.set(cv2.CAP_PROP_FRAME_WIDTH,  1920)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 1080)

    all_features = []  # Will hold all eye feature vectors
    all_targets_x = [] # Will hold screen x positions
    all_targets_y = [] # Will hold screen y positions

    # Create a full-screen black window
    screen = np.zeros((SCREEN_H, SCREEN_W, 3), dtype=np.uint8)

    for point_idx, (dot_x_frac, dot_y_frac) in enumerate(CALIBRATION_POINTS):
        # Convert fraction to pixel position
        dot_x = int(dot_x_frac * SCREEN_W)
        dot_y = int(dot_y_frac * SCREEN_H)

        print(f'Look at dot {point_idx + 1} of 9...')

        # Show the dot and wait 1 second for user to move eyes to it
        screen[:] = 0  # Clear screen to black
        cv2.circle(screen, (dot_x, dot_y), 20, (0, 255, 0), -1)  # Green dot
        cv2.putText(screen, f'Look here ({point_idx+1}/9)', (dot_x - 60, dot_y - 35),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
        cv2.imshow('GazeGuard Calibration', screen)
        cv2.waitKey(1000)   # Wait 1 second for eyes to settle on the dot

        # Now collect 30 frames of data while user looks at this dot
        samples_collected = 0
        while samples_collected < SAMPLES_PER_POINT:
            ret, frame = cap.read()
            if not ret: continue

            frame = cv2.flip(frame, 1)
            rgb   = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            results = face_mesh.process(rgb)

            if results.multi_face_landmarks:
                lm = results.multi_face_landmarks[0].landmark
                h, w = frame.shape[:2]
                features = get_gaze_features(lm, w, h)

                all_features.append(features)
                all_targets_x.append(dot_x)   # The screen X position user is looking at
                all_targets_y.append(dot_y)   # The screen Y position user is looking at
                samples_collected += 1

            # Update dot color to show progress
            progress = int((samples_collected / SAMPLES_PER_POINT) * 40)
            screen2 = screen.copy()
            cv2.circle(screen2, (dot_x, dot_y), 20, (0, 100 + progress*4, 0), -1)
            cv2.imshow('GazeGuard Calibration', screen2)
            cv2.waitKey(1)

    cap.release()
    cv2.destroyAllWindows()

    # Train the Ridge Regression model
    print('Training gaze model...')
    X = np.array(all_features)       # Shape: (270, 6)  — 270 samples, 6 features each
    y_x = np.array(all_targets_x)   # Shape: (270,)    — screen X targets
    y_y = np.array(all_targets_y)   # Shape: (270,)    — screen Y targets

    model_x = Ridge(alpha=1.0)   # Predicts screen X from eye features
    model_y = Ridge(alpha=1.0)   # Predicts screen Y from eye features
    model_x.fit(X, y_x)
    model_y.fit(X, y_y)

    # Save both models to disk so we never need to re-calibrate
    import os
    os.makedirs('../data', exist_ok=True)
    joblib.dump({'model_x': model_x, 'model_y': model_y}, '../data/gaze_model.pkl')
    print('Calibration complete! Model saved to data/gaze_model.pkl')




if __name__ == '__main__':
    run_calibration()
