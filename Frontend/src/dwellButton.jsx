// frontend/src/components/DwellButton.jsx
import React, { useState, useEffect, useRef } from 'react';

const DWELL_TIME_MS = 1500;  // 1.5 seconds to trigger

export default function DwellButton({ label, onSelect, gazePos, color = '#2E75B6' }) {
  const [progress, setProgress]     = useState(0);  // 0 to 100
  const [isGazing, setIsGazing]     = useState(false);
  const buttonRef   = useRef(null);
  const timerRef    = useRef(null);
  const startTimeRef = useRef(null);

  // Check every frame whether the gaze is inside this button
  useEffect(() => {
    if (!buttonRef.current) return;

    const rect = buttonRef.current.getBoundingClientRect();
    const isInside = (
      gazePos.x >= rect.left  &&
      gazePos.x <= rect.right &&
      gazePos.y >= rect.top   &&
      gazePos.y <= rect.bottom
    );

    if (isInside && !isGazing) {
      // Gaze just entered this button — start the dwell timer
      setIsGazing(true);
      startTimeRef.current = Date.now();

      timerRef.current = setInterval(() => {
        const elapsed  = Date.now() - startTimeRef.current;
        const pct      = Math.min((elapsed / DWELL_TIME_MS) * 100, 100);
        setProgress(pct);

        if (pct >= 100) {
          clearInterval(timerRef.current);
          onSelect();           // Trigger the button action!
          setProgress(0);
          setIsGazing(false);
        }
      }, 16);  // ~60fps

    } else if (!isInside && isGazing) {
      // Gaze left the button — cancel the dwell
      clearInterval(timerRef.current);
      setProgress(0);
      setIsGazing(false);
    }
  }, [gazePos]);

  return (
    <div
      ref={buttonRef}
      style={{
        position:     'relative',
        padding:      '20px',
        margin:       '8px',
        background:   isGazing ? '#1a3a5c' : color,
        color:        'white',
        borderRadius: '12px',
        fontSize:     '18px',
        fontWeight:   'bold',
        textAlign:    'center',
        cursor:       'default',
        minHeight:    '80px',
        display:      'flex',
        alignItems:   'center',
        justifyContent: 'center',
        // Progress ring using CSS gradient
        background: isGazing
          ? `conic-gradient(#00e676 ${progress * 3.6}deg, #1a3a5c 0deg)`
          : color,
        transition: 'background 0.1s',
        boxShadow: isGazing ? '0 0 20px rgba(0,230,118,0.5)' : 'none',
      }}
    >
      {label}
    </div>
  );
}
