import { useState, useEffect, useRef, useCallback } from 'react';
import { GAZE_WS_URL, GAZE_SCREEN_W, GAZE_SCREEN_H } from '../config/api';

const RECONNECT_DELAY = 2000;
const FACE_LOST_DEBOUNCE_MS = 800;
const WARMUP_MS = 2500;

/** Map backend screen pixels to this browser window's viewport. */
export function screenToViewport(gazex, gazey, screenW, screenH) {
  const sx = window.screenX ?? 0;
  const sy = window.screenY ?? 0;
  const vw = window.innerWidth || screenW;
  const vh = window.innerHeight || screenH;
  const x = ((gazex - sx) / screenW) * vw;
  const y = ((gazey - sy) / screenH) * vh;
  return { x, y };
}

export default function useGaze(onBlink, gazeAlpha) {
  const [gazePos, setGazePos] = useState({ x: 0, y: 0 });
  const [hasFace, setHasFace] = useState(false);
  const [connected, setConnected] = useState(false);
  const [streamLive, setStreamLive] = useState(false);
  const [warmup, setWarmup] = useState(true);
  const wsRef = useRef(null);
  const retryRef = useRef(null);
  const faceTimeoutRef = useRef(null);
  const warmupTimerRef = useRef(null);
  const onBlinkRef = useRef(onBlink);
  const smoothedRef = useRef({ x: 0, y: 0 });
  const gazeAlphaRef = useRef(gazeAlpha ?? 1);
  const screenSizeRef = useRef({ w: GAZE_SCREEN_W, h: GAZE_SCREEN_H });
  const unmountedRef = useRef(false);

  useEffect(() => { onBlinkRef.current = onBlink; }, [onBlink]);
  useEffect(() => { gazeAlphaRef.current = gazeAlpha ?? 1; }, [gazeAlpha]);

  const connect = useCallback(() => {
    if (unmountedRef.current) return;
    if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
      return;
    }

    try {
      const ws = new WebSocket(GAZE_WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        if (unmountedRef.current) {
          ws.close();
          return;
        }
        setConnected(true);
        setWarmup(true);
        clearTimeout(warmupTimerRef.current);
        warmupTimerRef.current = setTimeout(() => setWarmup(false), WARMUP_MS);
        if (retryRef.current) {
          clearTimeout(retryRef.current);
          retryRef.current = null;
        }
      };

      ws.onmessage = (event) => {
        try {
          setStreamLive(true);
          const data = JSON.parse(event.data);
          if (typeof data.screenw === 'number' && typeof data.screenh === 'number') {
            screenSizeRef.current = { w: data.screenw, h: data.screenh };
          }
          const { w: screenW, h: screenH } = screenSizeRef.current;

          if (typeof data.gazex === 'number' && typeof data.gazey === 'number') {
            const { x, y } = screenToViewport(data.gazex, data.gazey, screenW, screenH);
            const alpha = gazeAlphaRef.current;
            smoothedRef.current = {
              x: alpha * x + (1 - alpha) * smoothedRef.current.x,
              y: alpha * y + (1 - alpha) * smoothedRef.current.y,
            };
            setGazePos({ ...smoothedRef.current });
          }
          if (typeof data.hasface === 'boolean') {
            if (data.hasface === true) {
              clearTimeout(faceTimeoutRef.current);
              faceTimeoutRef.current = null;
              setHasFace(true);
              setWarmup(false);
            } else if (data.hasface === false && !faceTimeoutRef.current) {
              faceTimeoutRef.current = setTimeout(() => {
                setHasFace(false);
                faceTimeoutRef.current = null;
              }, FACE_LOST_DEBOUNCE_MS);
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
        setHasFace(false);
        setStreamLive(false);
        setWarmup(true);
        wsRef.current = null;
        if (!unmountedRef.current) {
          retryRef.current = setTimeout(connect, RECONNECT_DELAY);
        }
      };

      ws.onerror = () => {
        ws.close();
      };
    } catch (e) {
      if (!unmountedRef.current) {
        retryRef.current = setTimeout(connect, RECONNECT_DELAY);
      }
    }
  }, []);

  useEffect(() => {
    unmountedRef.current = false;
    connect();
    return () => {
      unmountedRef.current = true;
      clearTimeout(retryRef.current);
      clearTimeout(faceTimeoutRef.current);
      clearTimeout(warmupTimerRef.current);
      const ws = wsRef.current;
      if (!ws) return;
      ws.onclose = null;
      ws.onerror = null;
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      } else if (ws.readyState === WebSocket.CONNECTING) {
        ws.onopen = () => ws.close();
      }
      wsRef.current = null;
    };
  }, [connect]);

  return { gazePos, hasFace, connected, streamLive, warmup };
}
