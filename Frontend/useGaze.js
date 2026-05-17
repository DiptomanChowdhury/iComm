// frontend/src/useGaze.js
import { useState, useEffect, useRef } from 'react';

export default function useGaze(onBlink) {
  const [gazePos, setGazePos] = useState({ x: 0, y: 0 });
  const [hasFace, setHasFace] = useState(false);
  const wsRef = useRef(null);

  useEffect(() => {
    // Connect to the Python WebSocket server
    wsRef.current = new WebSocket('ws://localhost:8765');

    wsRef.current.onopen = () => {
      console.log('Connected to gaze engine');
    };

    wsRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setGazePos({ x: data.gaze_x, y: data.gaze_y });
      setHasFace(data.has_face);

      // If a blink was detected, call the onBlink callback
      if (data.blink) {
        onBlink(data.blink);  // 'short_blink' or 'long_blink'
      }
    };

    wsRef.current.onerror = () => console.error('WebSocket error');

    // Clean up when component unmounts
    return () => wsRef.current?.close();
  }, []);

  return { gazePos, hasFace };
}
