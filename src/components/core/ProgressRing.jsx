import React from 'react';

const SIZE = 100;
const STROKE_WIDTH = 4;
const RADIUS = 42;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default React.memo(function ProgressRing({ progress = 0 }) {
  const offset = CIRCUMFERENCE - (progress / 100) * CIRCUMFERENCE;

  return (
    <svg
      width={SIZE}
      height={SIZE}
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', pointerEvents: 'none' }}
      role="img"
      aria-label={`Dwell progress ${Math.round(progress)}%`}
    >
      <circle
        cx={SIZE / 2}
        cy={SIZE / 2}
        r={RADIUS}
        fill="none"
        stroke="rgba(255,255,255,0.1)"
        strokeWidth={STROKE_WIDTH}
      />
      <circle
        cx={SIZE / 2}
        cy={SIZE / 2}
        r={RADIUS}
        fill="none"
        stroke="var(--gaze-ring)"
        strokeWidth={STROKE_WIDTH}
        strokeDasharray={CIRCUMFERENCE}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
        style={{ transition: 'stroke-dashoffset 100ms linear' }}
      />
    </svg>
  );
});
