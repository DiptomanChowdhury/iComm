import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'icomm-settings';

const DEFAULT_SETTINGS = {
  dwellTime: 1500,
  gazeAlpha: 1,
  language: 'en',
  speechRate: 0.85,
  speechPitch: 1.0,
  speechVoice: null,
  emergencyPhone: '',
  caregiverPhone: '',
  customPhrases: [],
  highlightColor: '#00E676',
  calibrated: false,
  settingsPin: '0000',
};

export default function useSettings() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);

  useEffect(() => {
    if (window.electronAPI) {
      window.electronAPI.loadSettings().then((saved) => {
        if (saved) setSettings((prev) => ({ ...prev, ...saved }));
      });
      return;
    }
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        setSettings((prev) => ({ ...prev, ...saved }));
      }
    } catch {
      // ignore corrupt storage
    }
  }, []);

  const persist = useCallback((newSettings) => {
    if (window.electronAPI) {
      window.electronAPI.saveSettings(newSettings);
      return;
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
    } catch {
      // ignore quota errors
    }
  }, []);

  const updateSetting = useCallback((key, value) => {
    setSettings((prev) => {
      const next = { ...prev, [key]: value };
      persist(next);
      return next;
    });
  }, [persist]);

  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
    persist(DEFAULT_SETTINGS);
  }, [persist]);

  return { settings, updateSetting, resetSettings };
}
