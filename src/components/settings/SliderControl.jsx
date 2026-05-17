import React from 'react';

export default React.memo(function SliderControl({ label, value, min, max, step, onChange, unit = '' }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-1)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <label htmlFor={`slider-${label}`} style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>{label}</label>
        <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-primary)', fontWeight: 500 }}>
          {value}{unit}
        </span>
      </div>
      <input
        id={`slider-${label}`}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        aria-label={label}
        style={{
          width: '100%',
          height: 4,
          appearance: 'none',
          background: 'var(--bg-key)',
          borderRadius: 2,
          outline: 'none',
          cursor: 'pointer',
        }}
      />
    </div>
  );
});
