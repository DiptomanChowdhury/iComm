import { useState, useCallback } from 'react';

const DEFAULT_SETTINGS = {
  dwellTime: 1500,
  gazeAlpha: 0.2,
  language: 'en',
  speechRate: 0.85,
  speechPitch: 1.0,
  speechVoice: null,
  emergencyPhone: '',
  caregiverPhone: '',
  customPhrases: [],
  highlightColor: '#00E676',
  calibrated: false,
};

export default function useSettings() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);

  const updateSetting = useCallback((key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  }, []);

  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
  }, []);

  return { settings, updateSetting, resetSettings };
}
