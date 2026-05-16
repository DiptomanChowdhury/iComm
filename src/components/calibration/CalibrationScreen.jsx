import React, { useState, useCallback } from 'react';
import CalibrationDot from './CalibrationDot';
import { useSettingsContext } from '../../context/SettingsContext';

const DOT_POSITIONS = [
  { x: '10%', y: '10%' },
  { x: '50%', y: '10%' },
  { x: '90%', y: '10%' },
  { x: '10%', y: '50%' },
  { x: '50%', y: '50%' },
  { x: '90%', y: '50%' },
  { x: '10%', y: '90%' },
  { x: '50%', y: '90%' },
  { x: '90%', y: '90%' },
];

const POSITIONS_PX = [
  { x: window.innerWidth * 0.1, y: window.innerHeight * 0.15 },
  { x: window.innerWidth * 0.5, y: window.innerHeight * 0.15 },
  { x: window.innerWidth * 0.9, y: window.innerHeight * 0.15 },
  { x: window.innerWidth * 0.1, y: window.innerHeight * 0.5 },
  { x: window.innerWidth * 0.5, y: window.innerHeight * 0.5 },
  { x: window.innerWidth * 0.9, y: window.innerHeight * 0.5 },
  { x: window.innerWidth * 0.1, y: window.innerHeight * 0.85 },
  { x: window.innerWidth * 0.5, y: window.innerHeight * 0.85 },
  { x: window.innerWidth * 0.9, y: window.innerHeight * 0.85 },
];

export default React.memo(function CalibrationScreen({ onClose }) {
  const [phase, setPhase] = useState('intro');
  const [currentDot, setCurrentDot] = useState(0);
  const { updateSetting } = useSettingsContext();

  const handleDotComplete = useCallback(() => {
    if (currentDot < DOT_POSITIONS.length - 1) {
      setCurrentDot(prev => prev + 1);
    } else {
      setPhase('complete');
      updateSetting('calibrated', true);
      fetch('http://localhost:8000/calibrate-done', { method: 'POST', mode: 'no-cors' }).catch(() => {});
    }
  }, [currentDot, updateSetting]);

  if (phase === 'intro') {
    return (
      <div
        style={{
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
        }}
      >
        <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--text-primary)' }}>
          Eye Tracking Calibration
        </h1>
        <p style={{ fontSize: 'var(--text-lg)', color: 'var(--text-secondary)', textAlign: 'center', maxWidth: 500 }}>
          Look at each green dot as it appears. Hold your gaze steady until the ring completes.
        </p>
        <button
          type="button"
          onClick={() => setPhase('calibrating')}
          style={{
            padding: '12px 32px',
            fontSize: 'var(--text-lg)',
            background: 'var(--accent-blue)',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          Start Calibration
        </button>
      </div>
    );
  }

  if (phase === 'complete') {
    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: 'var(--bg-primary)',
          zIndex: 'var(--z-modal)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 'var(--sp-6)',
        }}
      >
        <div style={{ fontSize: 64, color: 'var(--accent-green)' }}>{'\u2713'}</div>
        <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--text-primary)' }}>
          Calibration complete!
        </h1>
        <button
          type="button"
          onClick={onClose}
          style={{
            padding: '12px 32px',
            fontSize: 'var(--text-lg)',
            background: 'var(--accent-blue)',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          Close
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'var(--bg-primary)',
        zIndex: 'var(--z-modal)',
      }}
    >
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
        Point {currentDot + 1} of {DOT_POSITIONS.length}
      </div>

      {POSITIONS_PX.slice(0, currentDot + 1).map((pos, i) => (
        <CalibrationDot
          key={i}
          num={i + 1}
          total={DOT_POSITIONS.length}
          position={pos}
          onComplete={i === currentDot ? handleDotComplete : () => {}}
        />
      ))}
    </div>
  );
});
