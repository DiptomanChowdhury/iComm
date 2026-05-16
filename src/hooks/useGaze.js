import { useState, useEffect, useRef, useCallback } from 'react';

const WS_URL = 'ws://localhost:8765';
const RECONNECT_DELAY = 2000;

export default function useGaze(onBlink, gazeAlpha) {
  const [gazePos, setGazePos] = useState({ x: 0, y: 0 });
  const [hasFace, setHasFace] = useState(false);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef(null);
  const retryRef = useRef(null);
  const faceTimeoutRef = useRef(null);
  const onBlinkRef = useRef(onBlink);
  const smoothedRef = useRef({ x: 0, y: 0 });

  useEffect(() => { onBlinkRef.current = onBlink; }, [onBlink]);

  const connect = useCallback(() => {
    if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
      return;
    }

    try {
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        setConnected(true);
        if (retryRef.current) {
          clearTimeout(retryRef.current);
          retryRef.current = null;
        }
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (typeof data.gazex === 'number' && typeof data.gazey === 'number') {
            const alpha = typeof gazeAlpha === 'number' ? gazeAlpha : 0.3;
            smoothedRef.current = {
              x: alpha * data.gazex + (1 - alpha) * smoothedRef.current.x,
              y: alpha * data.gazey + (1 - alpha) * smoothedRef.current.y,
            };
            setGazePos({ ...smoothedRef.current });
          }
          if (typeof data.hasface === 'boolean') {
            if (data.hasface === true) {
              clearTimeout(faceTimeoutRef.current);
              faceTimeoutRef.current = null;
              setHasFace(true);
            } else if (data.hasface === false && !faceTimeoutRef.current) {
              faceTimeoutRef.current = setTimeout(() => {
                setHasFace(false);
                faceTimeoutRef.current = null;
              }, 500);
            }
          }
          if (data.blink && onBlinkRef.current) {
            onBlinkRef.current(data.blink);
          }
        } catch (e) {
          // ignore parse errors
        }
      };

      ws.onclose = () => {
        setConnected(false);
        retryRef.current = setTimeout(connect, RECONNECT_DELAY);
      };

      ws.onerror = () => {
        ws.close();
      };
    } catch (e) {
      retryRef.current = setTimeout(connect, RECONNECT_DELAY);
    }
  }, []);

  useEffect(() => {
    connect();
    return () => {
      clearTimeout(retryRef.current);
      clearTimeout(faceTimeoutRef.current);
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [connect]);

  return { gazePos, hasFace, connected };
}
