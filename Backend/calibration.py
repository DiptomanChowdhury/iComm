# calibration.py
import cv2
import numpy as np
import time
import joblib
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestRegressor
from gaze_engine import get_face_landmarker, LEFT_IRIS, RIGHT_IRIS, get_gaze_features

# The 9 calibration dot positions as fractions of screen size
# (0.1, 0.1) = top left corner, (0.9, 0.9) = bottom right corner
# Inset from edges so dots stay visible on all monitors
CALIBRATION_POINTS = [
    (0.15, 0.15), (0.5, 0.15), (0.85, 0.15),
    (0.15, 0.5),  (0.5, 0.5),  (0.85, 0.5),
    (0.15, 0.85), (0.5, 0.85), (0.85, 0.85),
]

SCREEN_W = 1920   # Change to your screen width
SCREEN_H = 1080   # Change to your screen height
SAMPLES_PER_POINT = 30  # Collect 30 frames per dot = 30 training samples per point


def run_calibration():
    """
    Shows 9 dots on screen. User looks at each one for 2 seconds.
    Saves calibration model to data/gaze_model.pkl
    """
    print("Opening webcam...")
    cap = cv2.VideoCapture(0)
    
    if not cap.isOpened():
        print("ERROR: Cannot open webcam!")
        print("Please check:")
        print("  1. Webcam is connected")
        print("  2. No other app is using the webcam")
        print("  3. Camera permissions are enabled")
        return
    
    cap.set(cv2.CAP_PROP_FRAME_WIDTH,  1920)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 1080)
    
    print(f"Webcam opened successfully")
    print(f"Resolution: {int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))}x{int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))}")
    
    # Test if we can actually read frames
    print("\nTesting webcam... ", end='')
    for i in range(5):
        ret, test_frame = cap.read()
        if ret:
            print("✓ Working!")
            break
        cv2.waitKey(100)
    else:
        print("✗ Failed!")
        print("ERROR: Cannot read frames from webcam")
        cap.release()
        return

    all_features = []  # Will hold all eye feature vectors
    all_targets_x = [] # Will hold screen x positions
    all_targets_y = [] # Will hold screen y positions

    # Create a full-screen black window
    screen = np.zeros((SCREEN_H, SCREEN_W, 3), dtype=np.uint8)
    
    # Create the window and bring it to front
    cv2.namedWindow('GazeGuard Calibration', cv2.WINDOW_NORMAL)
    cv2.setWindowProperty('GazeGuard Calibration', cv2.WND_PROP_FULLSCREEN, cv2.WINDOW_FULLSCREEN)
    
    print("\nCalibration window should now be visible!")
    print("If you don't see it, check your taskbar or Alt+Tab to find it.")
    print("\nPress any key in the calibration window to start...")
    
    # Show initial instruction screen
    instruction_screen = screen.copy()
    cv2.putText(
        instruction_screen,
        'iComm Eye Tracking Calibration',
        (SCREEN_W // 2 - 300, SCREEN_H // 2 - 100),
        cv2.FONT_HERSHEY_SIMPLEX,
        1.5,
        (255, 255, 255),
        3
    )
    cv2.putText(
        instruction_screen,
        'Keep your head still and look at each green dot',
        (SCREEN_W // 2 - 400, SCREEN_H // 2),
        cv2.FONT_HERSHEY_SIMPLEX,
        1.0,
        (255, 255, 255),
        2
    )
    cv2.putText(
        instruction_screen,
        'Press any key to begin... (ESC to quit)',
        (SCREEN_W // 2 - 300, SCREEN_H // 2 + 100),
        cv2.FONT_HERSHEY_SIMPLEX,
        1.0,
        (0, 255, 0),
        2
    )
    cv2.imshow('GazeGuard Calibration', instruction_screen)
    key = cv2.waitKey(0)  # Wait for key press
    if key == 27:  # ESC
        print("Calibration cancelled")
        cap.release()
        cv2.destroyAllWindows()
        return

    for point_idx, (dot_x_frac, dot_y_frac) in enumerate(CALIBRATION_POINTS):
        # Convert fraction to pixel position
        dot_x = int(dot_x_frac * SCREEN_W)
        dot_y = int(dot_y_frac * SCREEN_H)

        print(f'\n=== Calibration Point {point_idx + 1} of 9 ===')
        print(f'Look at the green dot at position ({dot_x}, {dot_y})')
        print('Collecting samples...')

        # Show the dot and wait 1 second for user to move eyes to it
        screen[:] = 0  # Clear screen to black

        # Draw calibration dot
        cv2.circle(screen, (dot_x, dot_y), 20, (0, 255, 0), -1)

        # Dot label
        cv2.putText(
            screen,
            f'Look here ({point_idx+1}/9)',
            (dot_x - 60, dot_y - 35),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.7,
            (255, 255, 255),
            2
        )

        # IMPORTANT: Head stabilization instruction
        cv2.putText(
            screen,
            'Keep your head still - move only your eyes',
            (40, SCREEN_H - 40),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.8,
            (255,255,255),
            2
        )

        cv2.imshow('GazeGuard Calibration', screen)
        cv2.waitKey(1000)

        # Now collect 30 frames of data while user looks at this dot
        samples_collected = 0
        failed_frames = 0
        max_failed_frames = 300  # Give up after 10 seconds of no face detection
        # Rolling buffer for temporal stability check (last 3 frames)
        recent_features = []
        
        while samples_collected < SAMPLES_PER_POINT:
            ret, frame = cap.read()
            
            # CRITICAL: Always call waitKey to keep window responsive on Windows
            key = cv2.waitKey(1)
            if key == 27:  # ESC key to quit
                print("\nCalibration cancelled by user")
                cap.release()
                cv2.destroyAllWindows()
                return
            
            if not ret:
                print("Warning: Failed to read frame from webcam")
                continue

            frame = cv2.flip(frame, 1)
            rgb   = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            result = get_face_landmarker().process(rgb)

            if result.face_landmarks:
                lm = result.face_landmarks[0]
                h, w = frame.shape[:2]
                features = get_gaze_features(lm, w, h)
                # Reject jittery frames: check temporal stability across last 3 frames.
                # np.std(features) was always ~0.05-0.15 because all 6 features are
                # 0-1 ratios — that threshold of 0.25 blocked every single frame.
                recent_features.append(features)
                if len(recent_features) > 3:
                    recent_features.pop(0)
                if len(recent_features) >= 2:
                    # std across time (per-feature variance over recent frames)
                    temporal_std = np.std(recent_features, axis=0).mean()
                    if temporal_std > 0.02:  # iris jumped between frames — skip
                        continue
                all_features.append(features)
                all_targets_x.append(dot_x)   # The screen X position user is looking at
                all_targets_y.append(dot_y)   # The screen Y position user is looking at
                samples_collected += 1
                failed_frames = 0  # Reset counter on success
                
                # Show progress in console
                if samples_collected % 5 == 0:
                    print(f"  {samples_collected}/{SAMPLES_PER_POINT} samples...", end='\r')
            else:
                failed_frames += 1
                if failed_frames > max_failed_frames:
                    print(f"\nERROR: No face detected for too long. Make sure:")
                    print("  - You're sitting in front of the camera")
                    print("  - Your face is well-lit")
                    print("  - Camera has a clear view of your face")
                    cap.release()
                    cv2.destroyAllWindows()
                    return

            # Update dot color to show progress - ALWAYS update window
            progress = int((samples_collected / SAMPLES_PER_POINT) * 40)
            screen2 = screen.copy()
            cv2.circle(screen2, (dot_x, dot_y), 20, (0, 100 + progress*4, 0), -1)
            
            # Add progress text
            cv2.putText(
                screen2,
                f'Collecting: {samples_collected}/{SAMPLES_PER_POINT}',
                (dot_x - 100, dot_y + 60),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.6,
                (255, 255, 255),
                2
            )
            
            cv2.imshow('GazeGuard Calibration', screen2)
        
        print(f'✓ Point {point_idx + 1} complete! ({samples_collected} samples collected)')

    cap.release()
    cv2.destroyAllWindows()

    print('Training gaze model...')
    model_x, model_y = train_gaze_model(all_features, all_targets_x, all_targets_y)

    from pathlib import Path
    data_dir = Path(__file__).resolve().parent.parent / 'data'
    data_dir.mkdir(parents=True, exist_ok=True)
    output_path = data_dir / 'gaze_model.pkl'
    joblib.dump({
        'model_x': model_x,
        'model_y': model_y,
        'screen_w': SCREEN_W,
        'screen_h': SCREEN_H,
    }, output_path)
    print(f'Calibration complete! Model saved to {output_path}')


def train_gaze_model(all_features, all_targets_x, all_targets_y):
    """Train Ridge regression models mapping eye features to screen coordinates."""
    X = np.array(all_features)
    y_x = np.array(all_targets_x)
    y_y = np.array(all_targets_y)

    model_x = make_pipeline(
        StandardScaler(),
        RandomForestRegressor(
            n_estimators=200,
            max_depth=20,
            random_state=42,
        )
    )

    model_y = make_pipeline(
        StandardScaler(),
        RandomForestRegressor(
            n_estimators=200,
            max_depth=20,
            random_state=42,
        )
    )
    model_x.fit(X, y_x)
    model_y.fit(X, y_y)
    return model_x, model_y




if __name__ == '__main__':
    run_calibration()