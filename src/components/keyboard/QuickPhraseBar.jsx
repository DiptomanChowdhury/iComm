import React from 'react';
import DwellButton from '../core/DwellButton';

const QUICK_PHRASES = [
  { id: 'I', label: 'I' },
  { id: 'You', label: 'You' },
  { id: 'Yes', label: 'Yes' },
  { id: 'No', label: 'No' },
  { id: 'Please', label: 'Please' },
  { id: 'Thank you', label: 'Thank you' },
  { id: 'Hello', label: 'Hello' },
  { id: 'More', label: 'More \u25B8', isMore: true },
];

export default React.memo(function QuickPhraseBar({ onPhraseSelect, onOpenPhrases }) {
  return (
    <div
      style={{
        display: 'flex',
        gap: 4,
        padding: 'var(--sp-1) 0',
        height: 44,
        alignItems: 'center',
        overflow: 'hidden',
      }}
    >
      {QUICK_PHRASES.map((phrase) => (
        <DwellButton
          key={phrase.id}
          label={phrase.label}
          onSelect={() => phrase.isMore ? onOpenPhrases() : onPhraseSelect(phrase.label)}
          size="sm"
          variant="key"
          ariaLabel={phrase.isMore ? 'Open more phrases' : `Quick phrase: ${phrase.label}`}
          style={{
            flex: phrase.isMore ? 0.8 : 1,
            minWidth: 0,
            height: 36,
            fontSize: 'var(--text-sm)',
            background: phrase.isMore ? 'var(--bg-surface-2)' : 'var(--bg-key)',
            fontWeight: phrase.isMore ? 600 : 400,
          }}
        />
      ))}
    </div>
  );
});
