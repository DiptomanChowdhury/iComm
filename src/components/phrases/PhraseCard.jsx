import React from 'react';
import DwellButton from '../core/DwellButton';
import { useSettingsContext } from '../../context/SettingsContext';

export default React.memo(function PhraseCard({ phrase, onSelect }) {
  const { settings } = useSettingsContext();
  const displayText = settings.language === 'hi' ? phrase.hi : phrase.en;
  const subText = settings.language === 'hi' ? phrase.en : phrase.hi;

  return (
    <DwellButton
      label={
        <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <span style={{ fontSize: 'var(--text-base)', fontWeight: 500 }}>{displayText}</span>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', fontWeight: 400 }}>{subText}</span>
        </span>
      }
      onSelect={() => onSelect(displayText)}
      size="md"
      variant="phrase"
      ariaLabel={`Select phrase: ${displayText}`}
      style={{ width: '100%', minHeight: 72, flexDirection: 'column' }}
    />
  );
});
