import React, { createContext, useContext } from 'react';
import useSettings from '../hooks/useSettings';

export const SettingsContext = createContext(null);

export function SettingsProvider({ children }) {
  const { settings, updateSetting, resetSettings } = useSettings();

  return (
    <SettingsContext.Provider value={{ settings, updateSetting, resetSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export const useSettingsContext = () => {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettingsContext must be used within a SettingsProvider');
  return ctx;
};
