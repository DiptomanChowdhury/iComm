// frontend/src/App.jsx
import React, { useState, useCallback } from 'react';
import useGaze       from './useGaze';
import GazeCursor    from './components/GazeCursor';
import QuickPhrases  from './components/QuickPhrases';
import DwellButton   from './components/DwellButton';

const speak = (text) => {
  // Use browser's built-in speech synthesis
  // For Hindi, set lang to 'hi-IN'
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang  = text.match(/[\u0900-\u097F]/) ? 'hi-IN' : 'en-US';
  utterance.rate  = 0.85;  // Slightly slower for clarity
  window.speechSynthesis.speak(utterance);
};

export default function App() {
  const [view, setView]       = useState('phrases'); // 'phrases' or 'keyboard'
  const [language, setLang]   = useState('en');
  const [lastSpoken, setSpoken] = useState('');

  const handleBlink = useCallback((blinkType) => {
    if (blinkType === 'long_blink') {
      // Long blink = go back to main screen
      setView('phrases');
    }
  }, []);

  const { gazePos, hasFace } = useGaze(handleBlink);

  const handleSpeak = (text) => {
    speak(text);
    setSpoken(text);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0D1B2A', color: 'white', fontFamily: 'Arial' }}>

      {/* Gaze cursor — always visible */}
      <GazeCursor x={gazePos.x} y={gazePos.y} hasFace={hasFace} />

      {/* HELP button — always at top, triggers alert */}
      <div style={{ position: 'fixed', top: 10, right: 10, zIndex: 1000 }}>
        <DwellButton
          label='🆘 HELP'
          gazePos={gazePos}
          color='#B71C1C'
          onSelect={() => {
            speak('Help! I need assistance immediately!');
            fetch('http://localhost:8000/send-alert', { method: 'POST' });
          }}
        />
      </div>

      {/* Last spoken text */}
      <div style={{ textAlign: 'center', padding: '12px', fontSize: '20px', color: '#90CAF9' }}>
        {lastSpoken ? `Speaking: "${lastSpoken}"` : 'Look at a phrase to speak it'}
      </div>

      {/* Navigation */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 12 }}>
        <DwellButton label='Quick Phrases' gazePos={gazePos} onSelect={() => setView('phrases')} color='#1F4E79' />
        <DwellButton label='Keyboard'      gazePos={gazePos} onSelect={() => setView('keyboard')} color='#1B5E20' />
        <DwellButton label={language === 'en' ? 'Switch to Hindi' : 'Switch to English'}
                     gazePos={gazePos} onSelect={() => setLang(l => l === 'en' ? 'hi' : 'en')} color='#4A148C' />
      </div>

      {/* Main content area */}
      {view === 'phrases' && (
        <QuickPhrases gazePos={gazePos} language={language} onSpeak={handleSpeak} />
      )}

    </div>
  );
}
