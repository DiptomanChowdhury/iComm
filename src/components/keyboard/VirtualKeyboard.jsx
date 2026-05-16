import React, { useState, useCallback } from 'react';
import QuickPhraseBar from './QuickPhraseBar';
import KeyRow from './KeyRow';
import { ALPHA_LAYOUT, ALPHA_LAYOUT_SHIFT, NUMBERS_LAYOUT, BOTTOM_ROW } from './keyboardLayouts';
import { useSettingsContext } from '../../context/SettingsContext';

export default React.memo(function VirtualKeyboard({ onKeyPress, onOpenPhrases }) {
  const [isShiftActive, setIsShiftActive] = useState(false);
  const [isNumbersMode, setIsNumbersMode] = useState(false);
  const { settings, updateSetting } = useSettingsContext();

  const handleKeyPress = useCallback((keyId) => {
    switch (keyId) {
      case 'BACKSPACE':
        onKeyPress('BACKSPACE');
        break;
      case 'ENTER':
        onKeyPress('\n');
        break;
      case 'SHIFT':
        setIsShiftActive(prev => !prev);
        break;
      case 'SPACE':
        onKeyPress(' ');
        break;
      case 'TOGGLE_LAYOUT':
        setIsNumbersMode(prev => !prev);
        break;
      case 'TOGGLE_LANGUAGE':
        updateSetting('language', settings.language === 'en' ? 'hi' : 'en');
        break;
      default:
        onKeyPress(keyId);
        break;
    }
  }, [onKeyPress, settings.language, updateSetting]);

  const currentLayout = (() => {
    if (isNumbersMode) return NUMBERS_LAYOUT;
    return isShiftActive ? ALPHA_LAYOUT_SHIFT : ALPHA_LAYOUT;
  })();

  return (
    <div
      style={{
        background: 'var(--bg-surface)',
        padding: 'var(--sp-3)',
        borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0',
        borderTop: '1px solid var(--border-subtle)',
        height: 'var(--keyboard-height)',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
      }}
    >
      <QuickPhraseBar
        onPhraseSelect={(text) => onKeyPress(text + ' ')}
        onOpenPhrases={() => onOpenPhrases && onOpenPhrases()}
      />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4, justifyContent: 'center' }}>
        {currentLayout.rows.map((row, i) => (
          <KeyRow
            key={'row-' + i}
            keys={row}
            onKeyPress={handleKeyPress}
            isShiftActive={isShiftActive}
            isNumbersMode={isNumbersMode}
          />
        ))}
        <KeyRow
          keys={BOTTOM_ROW}
          onKeyPress={handleKeyPress}
          isShiftActive={isShiftActive}
          isNumbersMode={isNumbersMode}
        />
      </div>
    </div>
  );
});
