import React from 'react';
import Key from './Key';

export default React.memo(function KeyRow({ keys, onKeyPress, isShiftActive, isNumbersMode }) {
  return (
    <div
      style={{
        display: 'flex',
        gap: 4,
        justifyContent: 'center',
        width: '100%',
      }}
    >
      {keys.map((keyData, idx) => (
        <Key
          key={keyData.id + '-' + idx}
          keyData={keyData}
          onKeyPress={onKeyPress}
          isShiftActive={isShiftActive}
          isNumbersMode={isNumbersMode}
        />
      ))}
    </div>
  );
});
