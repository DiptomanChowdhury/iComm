import React, { useState, useEffect, useRef } from 'react';
import { useGazeContext } from '../../context/GazeContext';

export default React.memo(function CalibrationDot({ num, total, position, onComplete }) {
  const { gazePos } = useGazeContext();
  const [progress, setProgress] = useState(0);
  const [isGazing, setIsGazing] = useState(false);
  const [done, setDone] = useState(false);
  const dotRef = useRef(null);
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);

  useEffect(() => {
    if (!dotRef.current || done) return;

    const rect = dotRef.current.getBoundingClientRect();
    const padding = 90;
    const isInside =
      gazePos.x >= rect.left - padding &&
      gazePos.x <= rect.right + padding &&
      gazePos.y >= rect.top - padding &&
      gazePos.y <= rect.bottom + padding;

    if (isInside && !isGazing) {
      setIsGazing(true);
      startTimeRef.current = Date.now();

      timerRef.current = setInterval(() => {
        const elapsed = Date.now() - startTimeRef.current;
        const pct = Math.min((elapsed / 3000) * 100, 100);
        setProgress(pct);

        if (pct >= 100) {
          clearInterval(timerRef.current);
          timerRef.current = null;
          setDone(true);
          onComplete();
        }
      }, 16);
    } else if (!isInside && isGazing) {
      clearInterval(timerRef.current);
      timerRef.current = null;
      setProgress(0);
      setIsGazing(false);
    }
  }, [gazePos, done, isGazing, onComplete]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const size = done ? 28 : 24;
  const ringSize = done ? 40 : 60;
  const circumference = 2 * Math.PI * 14;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div
      ref={dotRef}
      data-calibration-dot={num}
      style={{
        position: 'absolute',
        left: position.x - ringSize / 2,
        top: position.y - ringSize / 2,
        width: ringSize,
        height: ringSize,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <svg width={ringSize} height={ringSize} viewBox={`0 0 ${ringSize} ${ringSize}`} style={{ position: 'absolute' }} role="img" aria-label={`Calibration dot ${num} progress`}>
        <circle
          cx={ringSize / 2}
          cy={ringSize / 2}
          r={14}
          fill="none"
          stroke="rgba(255,255,255,0.15)"
          strokeWidth={3}
        />
        {isGazing && (
          <circle
            cx={ringSize / 2}
            cy={ringSize / 2}
            r={14}
            fill="none"
            stroke="#00E676"
            strokeWidth={3}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            transform={`rotate(-90 ${ringSize / 2} ${ringSize / 2})`}
            style={{ transition: 'stroke-dashoffset 100ms linear' }}
          />
        )}
      </svg>
      <div
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          background: done ? '#00E676' : (isGazing ? '#2979FF' : '#00E676'),
          boxShadow: done
            ? '0 0 20px rgba(0,230,118,0.6)'
            : isGazing
            ? '0 0 20px rgba(0,230,118,0.4)'
            : 'none',
          transition: 'transform 0.2s, background 0.2s',
          transform: done ? 'scale(1.15)' : 'scale(1)',
        }}
      />
    </div>
  );
});
