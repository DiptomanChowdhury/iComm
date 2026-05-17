# Gaze-Blink Activation Overhaul

**Date:** 2026-05-18
**Status:** Draft

## Overview

Three interdependent fixes transforming iComm from head-tracking dwell-based interaction to
true eye-gaze blink-based interaction: relative iris features, long-blink button activation,
and calibration pipeline fixes.

---

## FIX 1 — Relative Iris Features (Backend)

**Problem:** `estimate_gaze_from_iris()` and `get_gaze_features()` use absolute iris
positions in the camera frame (`left_iris[0] / frame_w`). When the user moves their head,
the irises shift in the frame and the cursor moves, making the system track head position
instead of eye gaze direction. Calibration trains an ML model on the same absolute features,
so it inherits the same flaw.

**Solution:** Compute iris position relative to the eye socket corners. MediaPipe Face
Landmarker provides stable inner/outer corner landmarks for each eye:

- Left eye: inner corner `133`, outer corner `33`
- Right eye: inner corner `362`, outer corner `263`
- Left iris: `474-477`, right iris: `469-472`

For each eye, compute:

```
rel_x = (iris_center.x - corner_inner.x) / (corner_outer.x - corner_inner.x)
rel_y = (iris_center.y - corner_inner.y) / (corner_outer.y - corner_inner.y)
```

Both values are in `[0, 1]`. Head movement shifts the socket corners and iris together,
keeping relative values stable. Only actual eye movement changes the relative position.

**New feature vector** (still 6 elements, 2 values replaced):

```
[left_rel_x, left_rel_y, right_rel_x, right_rel_y, nose_x/w, nose_y/h]
```

Nose tip is retained as a head-pose anchor — it helps the model disambiguate extreme gaze
angles where the iris approaches the socket boundary.

**Stability:** The relative position is computed from raw landmark coordinates. To prevent
jitter from single-frame landmark noise, smooth the raw iris and corner coordinates over
3 frames via exponential moving average (alpha=0.4) before computing the ratio. This avoids
the amplification noise that ratio division introduces.

**Files changed:**
- `Backend/gaze_engine.py` — add corner landmark constants, `get_relative_iris_position()`,
  update `get_gaze_features()` and `estimate_gaze_from_iris()`, call `smoother.reset()` on
  face loss
- `Backend/calibration.py` — no code change (imports `get_gaze_features` from gaze_engine)

---

## FIX 2 — Long-Blink Button Activation (Frontend)

**Problem:** `DwellButton` fires `onSelect` when the dwell timer reaches 100% (~1.5s of
continuous gaze). This causes unintentional activations and the user cannot control when a
selection happens. The backend already sends blink events via WebSocket, and the frontend
already dispatches `'long-blink'` / `'short-blink'` CustomEvents, but no component listens
for them.

**Solution:** Dual-signal activation — dwell timer provides visual feedback (progress ring),
but the actual `onSelect` fires only on a `'long-blink'` event while the user is gazing at
the button.

**Activation flow:**
```
Look at button → isGazing=true → ring fills visually
                                   ↓
                         long blink (600ms+ closed) → onSelect fires → cooldown
                                   ↓
                         short blink (<600ms) → progress resets, gaze cancelled
```

**DwellButton.jsx changes:**
- Keep dwell `setInterval` for progress ring animation — no functional change
- Add `useEffect` listening for `'long-blink'` on `window`
- On `'long-blink'`: if `isGazing && !cooldown && !disabled`, call `onSelect()`,
  set cooldown 800ms, reset progress
- On `'short-blink'`: if `isGazing`, reset progress, cancel `isGazing`
- Cooldown block: during cooldown, ignore gaze entry and blink events
- If face lost (`!hasFace`), clear everything
- Flash confirmation on activation (brief green glow via state)

**CalibrationDot.jsx changes:**
- Same dual-signal pattern: 3s progress ring on gaze, fire `onComplete` on long-blink
- Short blink cancels current dot (user can retry by gazing again)
- This replaces the old 3s dwell completion

**GazeContext.jsx:**
- No changes needed — already dispatches `'long-blink'` / `'short-blink'`

**Files changed:**
- `src/components/core/DwellButton.jsx` — blink listener, short-blink cancellation
- `src/components/calibration/CalibrationDot.jsx` — blink listener, dual-signal

---

## FIX 3 — Calibration Pipeline Fixes (Both)

**Problem:** Calibration failed silently — absolute-feature model was useless, WebSocket
message timing was fragile, and the 3s dwell completion was inconsistent with blink-based
interaction.

**Solution:**

**Backend:**
- Feature extraction already imports from `gaze_engine` — Fix 1 automatically fixes
  calibration data
- `GazeHub._capture_loop` calibration path stores `get_gaze_features(lm, w, h)` — picks
  up relative features
- `GazeHub.handle_client_message` already handles `calib_start/point/done/cancel` — no
  additional backend changes needed

**Frontend CalibrationScreen.jsx:**
- Ensure `calib_start` is sent only after WebSocket `connected === true`
- Send `calib_start` with correct `screen_w` / `screen_h` from `window.innerWidth/Height`
- Track `gaze-calib-progress` detail to show real-time sample count on each dot
- If WebSocket disconnects mid-calibration, show warning and return to intro
- Training phase listens for `gaze-model-ready` CustomEvent (already dispatched by backend)
- On complete, set `calibrated` setting and show success screen

**Full calibration flow:**
```
1. User opens Settings → clicks "Calibration"
2. CalibrationScreen shows intro with "Start" button
3. User clicks Start → connected check → send calib_start → phase='calibrating'
4. For each of 9 dots:
   a. send calib_point with target_x/y
   b. user gazes at dot → ring fills → long-blink → onDotComplete
   c. send calib_point_done
   d. advance to next dot (or phase='training' on last)
5. Backend trains Ridge model → saves to data/gaze_model.pkl
6. Backend sends payload with model_ready: true
7. Frontend receives gaze-model-ready → phase='complete'
8. User clicks "Continue" → calibration saved, returns to app
```

**Files changed:**
- `src/components/calibration/CalibrationScreen.jsx` — connected guard, progress display,
  disconnect handling, phase transitions
- `src/components/calibration/CalibrationDot.jsx` — already covered in Fix 2

---

## Regression Risk & Mitigation

| Risk | Mitigation |
|---|---|
| Relative position noisy when socket landmarks jitter | Smooth over 3 frames before computing ratio |
| Old calibration model in `data/gaze_model.pkl` | Delete old file; re-run calibration (or handle gracefully as "no model") |
| Short-blink cancels legitimate gaze just as user blinks naturally | BlinkDetector already requires 150ms minimum; natural blinks (~100ms) won't trigger |
| WebSocket disconnect during calibration | Show warning overlay, preserve partial progress |
