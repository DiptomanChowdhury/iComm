import React from 'react';
import DwellButton from '../core/DwellButton';

export default React.memo(function Key({ keyData, onKeyPress, isShiftActive, isNumbersMode }) {
  const { id, label, displayLabel, width } = keyData;

  const handleSelect = () => {
    onKeyPress(id);
  };

  const getDisplayLabel = () => {
    if (id === 'SHIFT') {
      return isShiftActive ? '\u21E7\u25CF' : '\u21E7';
    }
    if (id === 'TOGGLE_LAYOUT') {
      return isNumbersMode ? 'ABC' : '123';
    }
    return displayLabel || label;
  };

  const getAriaLabel = () => {
    switch (id) {
      case 'BACKSPACE': return 'Keyboard key: Backspace';
      case 'ENTER': return 'Keyboard key: Enter';
      case 'SHIFT': return 'Keyboard key: Shift';
      case 'SPACE': return 'Keyboard key: Space';
      case 'TOGGLE_LAYOUT': return 'Toggle keyboard layout';
      case 'TOGGLE_LANGUAGE': return 'Toggle language';
      default: return `Keyboard key: ${id}`;
    }
  };

  return (
    <div style={{ flex: width || 1, minWidth: 0 }}>
      <DwellButton
        label={getDisplayLabel()}
        onSelect={handleSelect}
        size="sm"
        variant="key"
        ariaLabel={getAriaLabel()}
        style={{
          width: '100%',
          height: 52,
          minHeight: 44,
          borderRadius: 'var(--radius-md)',
          fontSize: id === 'SPACE' ? 'var(--text-sm)' : 'var(--text-lg)',
          fontWeight: id === 'ENTER' ? 600 : 500,
        }}
      />
    </div>
  );
});
