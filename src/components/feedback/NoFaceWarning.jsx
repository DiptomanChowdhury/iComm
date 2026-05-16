import React from 'react';
import { useGazeContext } from '../../context/GazeContext';

export default React.memo(function NoFaceWarning() {
  const { hasFace, connected } = useGazeContext();

  if (hasFace || !connected) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.85)',
        zIndex: 'var(--z-overlay)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 'var(--sp-4)',
      }}
      role="alert"
      aria-live="assertive"
    >
      <div
        style={{
          width: 80,
          height: 80,
          borderRadius: '50%',
          border: '3px solid var(--accent-yellow)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 40,
          animation: 'dwell-pulse 2s ease-in-out infinite',
        }}
        aria-hidden="true"
      >
        {'\u26A0\uFE0F'}
      </div>
      <h2 style={{ fontSize: 'var(--text-xl)', color: 'var(--text-primary)' }}>
        Eye Tracking Lost
      </h2>
      <p style={{ fontSize: 'var(--text-base)', color: 'var(--text-secondary)' }}>
        Please look directly at the camera
      </p>
    </div>
  );
});
