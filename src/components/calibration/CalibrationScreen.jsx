import React, { useState, useEffect, useCallback } from 'react';
import CalibrationDot from './CalibrationDot';
import DwellButton from '../core/DwellButton';
import { useSettingsContext } from '../../context/SettingsContext';
import { useGazeContext } from '../../context/GazeContext';

const DOT_COUNT = 9;

const overlayStyle = {
  position: 'fixed',
  inset: 0,
  background: 'var(--bg-primary)',
  zIndex: 'var(--z-modal)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 'var(--sp-6)',
  padding: 'var(--sp-8)',
};

export default React.memo(function CalibrationScreen({ onClose }) {
  const [phase, setPhase] = useState('intro');
  const [currentDot, setCurrentDot] = useState(0);
  const [positionsPx, setPositionsPx] = useState([]);
  const [sampleProgress, setSampleProgress] = useState(0);
  const { updateSetting } = useSettingsContext();
  const { sendMessage, connected } = useGazeContext();

  useEffect(() => {
    const compute = () => setPositionsPx([
      { x: window.innerWidth * 0.15,  y: window.innerHeight * 0.15 },
      { x: window.innerWidth * 0.5,   y: window.innerHeight * 0.15 },
      { x: window.innerWidth * 0.85,  y: window.innerHeight * 0.15 },
      { x: window.innerWidth * 0.15,  y: window.innerHeight * 0.5  },
      { x: window.innerWidth * 0.5,   y: window.innerHeight * 0.5  },
      { x: window.innerWidth * 0.85,  y: window.innerHeight * 0.5  },
      { x: window.innerWidth * 0.15,  y: window.innerHeight * 0.85 },
      { x: window.innerWidth * 0.5,   y: window.innerHeight * 0.85 },
      { x: window.innerWidth * 0.85,  y: window.innerHeight * 0.85 },
    ]);
    compute();
    window.addEventListener('resize', compute);
    return () => window.removeEventListener('resize', compute);
  }, []);

  useEffect(() => {
    const onReady = () => {
      updateSetting('calibrated', true);
      setPhase('complete');
    };
    const onProgress = (e) => {
      setSampleProgress(e.detail?.samples ?? 0);
    };
    window.addEventListener('gaze-model-ready', onReady);
    window.addEventListener('gaze-calib-progress', onProgress);
    return () => {
      window.removeEventListener('gaze-model-ready', onReady);
      window.removeEventListener('gaze-calib-progress', onProgress);
    };
  }, [updateSetting]);

  useEffect(() => {
    if (phase !== 'calibrating' || positionsPx.length === 0) return;
    const pos = positionsPx[currentDot];
    sendMessage({
      type: 'calib_point',
      target_x: Math.round(pos.x),
      target_y: Math.round(pos.y),
    });
    setSampleProgress(0);
  }, [phase, currentDot, positionsPx, sendMessage]);

  const startCalibration = useCallback(() => {
    if (!connected) {
      window.alert('Gaze engine not connected. Run: npm run backend:gaze');
      return;
    }
    sendMessage({
      type: 'calib_start',
      screen_w: window.innerWidth,
      screen_h: window.innerHeight,
    });
    setCurrentDot(0);
    setPhase('calibrating');
  }, [connected, sendMessage]);

  const handleDotComplete = useCallback(() => {
    sendMessage({ type: 'calib_point_done' });
    if (currentDot < DOT_COUNT - 1) {
      setCurrentDot((prev) => prev + 1);
    } else {
      setPhase('training');
    }
  }, [currentDot, sendMessage]);

  const handleCancel = useCallback(() => {
    sendMessage({ type: 'calib_cancel' });
    onClose();
  }, [sendMessage, onClose]);

  if (phase === 'intro') {
    return (
      <div style={overlayStyle}>
        <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--text-primary)' }}>
          Eye Tracking Calibration
        </h1>
        <p style={{ fontSize: 'var(--text-lg)', color: 'var(--text-secondary)', textAlign: 'center', maxWidth: 520 }}>
          Look at each green dot and hold your gaze until the ring completes.
          This trains the gaze model for <strong>this browser window</strong>.
        </p>
        {!connected && (
          <p style={{ color: '#ff6b6b', fontSize: 'var(--text-sm)' }}>
            Gaze engine offline — run npm run backend:gaze first.
          </p>
        )}
        <DwellButton
          label="Start Calibration"
          variant="action"
          size="lg"
          ariaLabel="Start eye tracking calibration"
          onSelect={startCalibration}
          disabled={!connected}
        />
        <DwellButton label="Cancel" variant="key" size="md" onSelect={onClose} />
      </div>
    );
  }

  if (phase === 'training') {
    return (
      <div style={overlayStyle}>
        <p style={{ fontSize: 'var(--text-lg)', color: 'var(--text-secondary)' }}>
          Training gaze model… keep facing the webcam.
        </p>
        {sampleProgress > 0 && (
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
            Collecting samples: {sampleProgress} / 30
          </p>
        )}
      </div>
    );
  }

  if (phase === 'complete') {
    return (
      <div style={overlayStyle}>
        <div style={{ fontSize: 64, color: 'var(--accent-green)' }}>{'\u2713'}</div>
        <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--text-primary)' }}>
          Calibration complete!
        </h1>
        <p style={{ fontSize: 'var(--text-base)', color: 'var(--text-secondary)', textAlign: 'center' }}>
          Gaze model saved. The cursor should track your eyes in this window.
        </p>
        <DwellButton
          label="Continue"
          variant="action"
          size="lg"
          ariaLabel="Close calibration"
          onSelect={onClose}
        />
      </div>
    );
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'var(--bg-primary)', zIndex: 'var(--z-modal)' }}>
      <div
        style={{
          position: 'absolute',
          top: 20,
          left: '50%',
          transform: 'translateX(-50%)',
          fontSize: 'var(--text-sm)',
          color: 'var(--text-secondary)',
          background: 'var(--bg-surface)',
          padding: '8px 16px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)',
        }}
      >
        Point {currentDot + 1} of {DOT_COUNT}
        {sampleProgress > 0 && ` · samples ${sampleProgress}/30`}
      </div>

      {positionsPx.length > 0 && positionsPx.slice(0, currentDot + 1).map((pos, i) => (
        <CalibrationDot
          key={i}
          num={i + 1}
          total={DOT_COUNT}
          position={pos}
          onComplete={i === currentDot ? handleDotComplete : () => {}}
        />
      ))}

      <div style={{ position: 'absolute', bottom: 24, right: 24 }}>
        <DwellButton label="Cancel" variant="key" size="sm" onSelect={handleCancel} />
      </div>
    </div>
  );
});
