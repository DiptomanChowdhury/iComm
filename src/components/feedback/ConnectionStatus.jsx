import React, { useState, useEffect, useRef } from 'react';
import { useGazeContext } from '../../context/GazeContext';

export default React.memo(function ConnectionStatus() {
  const { connected } = useGazeContext();
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [show, setShow] = useState(false);
  const prevConnected = useRef(null);
  const hideTimer = useRef(null);

  useEffect(() => {
    if (prevConnected.current === null) {
      prevConnected.current = connected;
      return;
    }

    if (prevConnected.current === true && connected === false) {
      setMessage('Eye tracker disconnected - reconnecting...');
      setShow(true);
    } else if (prevConnected.current === false && connected === true) {
      setMessage('Eye tracker reconnected');
      setShow(true);
      if (hideTimer.current) clearTimeout(hideTimer.current);
      hideTimer.current = setTimeout(() => {
        setShow(false);
      }, 3000);
    }

    prevConnected.current = connected;
  }, [connected]);

  useEffect(() => {
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, []);

  if (!show) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed',
        bottom: 16,
        right: 16,
        zIndex: 'var(--z-float)',
        background: connected ? 'rgba(0,230,118,0.15)' : 'rgba(211,47,47,0.15)',
        border: `1px solid ${connected ? 'var(--accent-green)' : 'var(--accent-red)'}`,
        borderRadius: 'var(--radius-md)',
        padding: '10px 16px',
        fontSize: 'var(--text-sm)',
        color: connected ? 'var(--accent-green)' : 'var(--accent-red)',
        fontWeight: 500,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        transition: 'opacity 0.3s ease, transform 0.3s ease',
        opacity: show ? 1 : 0,
        transform: show ? 'translateY(0)' : 'translateY(10px)',
      }}
    >
      <span style={{ fontSize: 14 }}>{connected ? '\uD83D\uDFE2' : '\uD83D\uDD34'}</span>
      {message}
    </div>
  );
});
