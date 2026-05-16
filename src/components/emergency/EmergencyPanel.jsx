import React from 'react';
import DwellButton from '../core/DwellButton';

export default React.memo(function EmergencyPanel({ onAction }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)' }}>
      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--accent-red)', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
        Emergency
      </span>
      <DwellButton
        label="Emergency Call"
        variant="emergency"
        size="sm"
        ariaLabel="Emergency Call — dwell to trigger"
        onSelect={() => onAction('emergency')}
        style={{ width: '100%', background: 'var(--accent-red)', color: '#FFFFFF', fontWeight: 600 }}
      />
      <DwellButton
        label="Caregiver Alert"
        variant="emergency"
        size="sm"
        ariaLabel="Caregiver Alert — dwell to trigger"
        onSelect={() => onAction('caregiver')}
        style={{ width: '100%', background: 'var(--accent-orange)', color: '#FFFFFF', fontWeight: 600 }}
      />
      <DwellButton
        label="Quick Message"
        variant="emergency"
        size="sm"
        ariaLabel="Quick Message — dwell to trigger"
        onSelect={() => onAction('quickmsg')}
        style={{ width: '100%', background: 'var(--accent-yellow)', color: '#0D1B2A', fontWeight: 600 }}
      />
    </div>
  );
});
