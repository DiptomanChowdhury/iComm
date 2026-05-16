import { useState, useEffect, useRef, useCallback } from 'react';

const WS_URL = 'ws://localhost:8765';
const RECONNECT_DELAY = 2000;

export default function useGaze(onBlink) {
  const [gazePos, setGazePos] = useState({ x: 0, y: 0 });
  const [hasFace, setHasFace] = useState(false);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef(null);
  const retryRef = useRef(null);

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
            setGazePos({ x: data.gazex, y: data.gazey });
          }
          if (typeof data.hasface === 'boolean') {
            setHasFace(data.hasface);
          }
          if (data.blink && onBlink) {
            onBlink(data.blink);
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
  }, [onBlink]);

  useEffect(() => {
    connect();
    return () => {
      clearTimeout(retryRef.current);
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [connect]);

  return { gazePos, hasFace, connected };
}
