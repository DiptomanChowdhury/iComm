// frontend/src/components/QuickPhrases.jsx
import React from 'react';
import DwellButton from './dwellButton';

// Default phrases — caregiver can edit these in Settings
const PHRASES = [
  { en: 'I need water',      hi: 'मुझे पानी चाहिए' },
  { en: 'I am in pain',      hi: 'मुझे दर्द है' },
  { en: 'Call my family',    hi: 'मेरे परिवार को बुलाओ' },
  { en: 'I need the toilet', hi: 'मुझे शौचालय चाहिए' },
  { en: 'I am hungry',       hi: 'मुझे भूख लगी है' },
  { en: 'I am cold',         hi: 'मुझे ठंड लग रही है' },
  { en: 'I am hot',          hi: 'मुझे गर्मी लग रही है' },
  { en: 'Thank you',         hi: 'धन्यवाद' },
  { en: 'Yes',               hi: 'हाँ' },
  { en: 'No',                hi: 'नहीं' },
  { en: 'I love you',        hi: 'मैं तुमसे प्यार करता हूँ' },
  { en: 'Please wait',       hi: 'कृपया प्रतीक्षा करें' },
];

export default function QuickPhrases({ gazePos, language = 'en', onSpeak }) {
  const speak = (phrase) => {
    const text = language === 'hi' ? phrase.hi : phrase.en;
    onSpeak(text);  // Pass to TTS handler in parent
  };

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',  // 3 columns
      gap: '10px',
      padding: '20px',
    }}>
      {PHRASES.map((phrase, i) => (
        <DwellButton
          key={i}
          label={language === 'hi' ? phrase.hi : phrase.en}
          gazePos={gazePos}
          onSelect={() => speak(phrase)}
          color='#1F4E79'
        />
      ))}
    </div>
  );
}
