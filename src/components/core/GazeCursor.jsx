import React from 'react';
import { useGazeContext } from '../../context/GazeContext';

export default React.memo(function GazeCursor() {
  const { gazePos, hasFace } = useGazeContext();

  return (
    <div
      style={{
        position: 'fixed',
        left: gazePos.x - 8,
        top: gazePos.y - 8,
        width: 16,
        height: 16,
        borderRadius: '50%',
        background: hasFace ? 'var(--gaze-cursor-face)' : 'var(--gaze-cursor-no-face)',
        pointerEvents: 'none',
        zIndex: 'var(--z-cursor)',
        transform: 'translate(0, 0)',
        willChange: 'left, top',
        boxShadow: hasFace
          ? '0 0 12px rgba(0,200,100,0.6), inset 0 0 4px rgba(255,255,255,0.4)'
          : '0 0 12px rgba(255,80,80,0.6), inset 0 0 4px rgba(255,255,255,0.4)',
        transition: hasFace ? 'background 0.2s, box-shadow 0.2s' : 'background 0.2s, box-shadow 0.2s',
      }}
      aria-hidden="true"
    />
  );
});
