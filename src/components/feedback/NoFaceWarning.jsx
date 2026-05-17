import React from 'react';
import { useGazeContext } from '../../context/GazeContext';

/**
 * Non-blocking banner when the tracker is connected but cannot see a face.
 * The UI stays usable via mouse click on buttons.
 */
export default React.memo(function NoFaceWarning() {
  const { hasFace, connected, streamLive, warmup } = useGazeContext();

  if (!connected || hasFace || warmup || !streamLive) return null;

  return (
    <div
      role="alert"
      aria-live="polite"
      style={{
        position: 'fixed',
        top: 'calc(var(--header-height) + 8px)',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 'var(--z-overlay)',
        maxWidth: 480,
        width: 'calc(100% - 32px)',
        background: 'rgba(230, 81, 0, 0.95)',
        border: '1px solid var(--accent-yellow)',
        borderRadius: 'var(--radius-md)',
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        boxShadow: 'var(--shadow-lg)',
        pointerEvents: 'none',
      }}
    >
      <span style={{ fontSize: 22 }} aria-hidden="true">{'\u26A0\uFE0F'}</span>
      <div>
        <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)', color: '#fff' }}>
          Eye tracking lost
        </div>
        <div style={{ fontSize: 'var(--text-xs)', color: 'rgba(255,255,255,0.9)', marginTop: 2 }}>
          Look at your webcam. You can still click buttons with the mouse.
        </div>
      </div>
    </div>
  );
});
