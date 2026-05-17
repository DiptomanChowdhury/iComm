import { useCallback } from 'react';
import { useSettingsContext } from '../context/SettingsContext';

export default function useTTS() {
  const { speechRate, speechPitch, speechVoice, language } = useSettingsContext();

  const speak = useCallback((text) => {
    if (!text) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language === 'hi' ? 'hi-IN' : 'en-US';
    utterance.rate = speechRate;
    utterance.pitch = speechPitch;
    if (speechVoice) utterance.voice = speechVoice;
    window.speechSynthesis.speak(utterance);
  }, [speechRate, speechPitch, speechVoice, language]);

  const cancel = useCallback(() => {
    window.speechSynthesis.cancel();
  }, []);

  return { speak, cancel };
}
