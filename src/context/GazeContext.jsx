import React, { createContext, useContext, useCallback } from 'react';
import useGaze from '../hooks/useGaze';
import { useSettingsContext } from './SettingsContext';

export const GazeContext = createContext(null);

export function GazeProvider({ children }) {
  const handleBlink = useCallback((blinkType) => {
    if (blinkType === 'long_blink') {
      window.dispatchEvent(new CustomEvent('long-blink'));
    } else if (blinkType === 'short_blink') {
      window.dispatchEvent(new CustomEvent('short-blink'));
    }
  }, []);
  const { settings } = useSettingsContext();
  const gaze = useGaze(handleBlink, settings.gazeAlpha);

  return (
    <GazeContext.Provider value={gaze}>
      {children}
    </GazeContext.Provider>
  );
}

export const useGazeContext = () => {
  const ctx = useContext(GazeContext);
  if (!ctx) throw new Error('useGazeContext must be used within a GazeProvider');
  return ctx;
};
