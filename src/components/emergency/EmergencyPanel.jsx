import React, { useState, useCallback, useRef } from 'react';
import DwellButton from '../core/DwellButton';
import EmergencyConfirmModal from './EmergencyConfirmModal';

export default React.memo(function EmergencyPanel() {
  const [emergencyModal, setEmergencyModal] = useState(null);
  const [emergencyCooldown, setEmergencyCooldown] = useState({ emergency: false, caregiver: false, quickmsg: false });
  const cooldownTimers = useRef({});

  const startCooldown = useCallback((type) => {
    setEmergencyCooldown(prev => ({ ...prev, [type]: true }));
    clearTimeout(cooldownTimers.current[type]);
    cooldownTimers.current[type] = setTimeout(() => {
      setEmergencyCooldown(prev => ({ ...prev, [type]: false }));
    }, 30000);
  }, []);

  const handleEmergencyAction = useCallback((action) => {
    startCooldown(action);
    setEmergencyModal(null);
  }, [startCooldown]);

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)' }}>
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--accent-red)', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
          Emergency
        </span>
        <DwellButton
          label="Emergency Call"
          variant="emergency"
          size="sm"
          ariaLabel="Emergency Call - dwell to trigger"
          onSelect={() => setEmergencyModal('emergency')}
          disabled={emergencyCooldown.emergency}
          style={{ width: '100%', background: 'var(--accent-red)', color: '#FFFFFF', fontWeight: 600 }}
        />
        <DwellButton
          label="Caregiver Alert"
          variant="emergency"
          size="sm"
          ariaLabel="Caregiver Alert - dwell to trigger"
          onSelect={() => setEmergencyModal('caregiver')}
          disabled={emergencyCooldown.caregiver}
          style={{ width: '100%', background: 'var(--accent-orange)', color: '#FFFFFF', fontWeight: 600 }}
        />
        <DwellButton
          label="Quick Message"
          variant="emergency"
          size="sm"
          ariaLabel="Quick Message - dwell to trigger"
          onSelect={() => setEmergencyModal('quickmsg')}
          disabled={emergencyCooldown.quickmsg}
          style={{ width: '100%', background: 'var(--accent-yellow)', color: '#0D1B2A', fontWeight: 600 }}
        />
      </div>
      {emergencyModal && (
        <EmergencyConfirmModal
          action={emergencyModal}
          onConfirm={handleEmergencyAction}
          onCancel={() => setEmergencyModal(null)}
        />
      )}
    </>
  );
});
