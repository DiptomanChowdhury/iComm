import React, { createContext, useContext, useCallback } from 'react';
import useGaze from '../hooks/useGaze';

export const GazeContext = createContext(null);

export function GazeProvider({ children }) {
  const handleBlink = useCallback((blinkType) => {
    if (blinkType === 'long_blink') {
      const event = new CustomEvent('long-blink');
      window.dispatchEvent(event);
    }
  }, []);

  const { gazePos, hasFace, connected } = useGaze(handleBlink);

  return (
    <GazeContext.Provider value={{ gazePos, hasFace, connected }}>
      {children}
    </GazeContext.Provider>
  );
}

export const useGazeContext = () => {
  const ctx = useContext(GazeContext);
  if (!ctx) throw new Error('useGazeContext must be used within a GazeProvider');
  return ctx;
};
