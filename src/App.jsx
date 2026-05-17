import React, { useState, useCallback } from 'react';
import { GazeProvider } from './context/GazeContext';
import { SettingsProvider } from './context/SettingsContext';
import AppShell from './components/layout/AppShell';
import CalibrationScreen from './components/calibration/CalibrationScreen';
import SettingsPanel from './components/settings/SettingsPanel';

export default function App() {
  const [view, setView] = useState('keyboard');
  const [messageText, setMessage] = useState('');
  const [settingsOpen, setSettings] = useState(false);
  const [calibOpen, setCalib] = useState(false);

  const appendToMessage = useCallback((text) => {
    setMessage(prev => prev + text);
  }, []);

  const clearMessage = useCallback(() => {
    setMessage('');
  }, []);

  const backspaceMessage = useCallback(() => {
    setMessage(prev => prev.slice(0, -1));
  }, []);

  return (
    <SettingsProvider>
      <GazeProvider>
        {calibOpen && (
          <CalibrationScreen onClose={() => setCalib(false)} />
        )}
        {settingsOpen && (
          <SettingsPanel
            onClose={() => setSettings(false)}
            onOpenCalibration={() => { setSettings(false); setCalib(true); }}
          />
        )}
        <AppShell
          view={view}
          setView={setView}
          messageText={messageText}
          appendToMessage={appendToMessage}
          clearMessage={clearMessage}
          backspaceMessage={backspaceMessage}
          onOpenSettings={() => setSettings(true)}
        />
      </GazeProvider>
    </SettingsProvider>
  );
}
