import React, { useState, useCallback, useRef } from 'react';
import DwellButton from '../core/DwellButton';
import EmergencyPanel from '../emergency/EmergencyPanel';
import EmergencyConfirmModal from '../emergency/EmergencyConfirmModal';
import { useSettingsContext } from '../../context/SettingsContext';
import useTTS from '../../hooks/useTTS';
import { postAlert } from '../../utils/postAlert';

export default React.memo(function Sidebar({ messageText, clearMessage, backspaceMessage }) {
  const [emergencyModal, setEmergencyModal] = useState(null);
  const [emergencyCooldown, setEmergencyCooldown] = useState({ emergency: false, caregiver: false, quickmsg: false });
  const cooldownTimers = useRef({});
  const { settings } = useSettingsContext();
  const { speak } = useTTS();

  const startCooldown = useCallback((type) => {
    setEmergencyCooldown(prev => ({ ...prev, [type]: true }));
    clearTimeout(cooldownTimers.current[type]);
    cooldownTimers.current[type] = setTimeout(() => {
      setEmergencyCooldown(prev => ({ ...prev, [type]: false }));
    }, 30000);
  }, []);

  const handleEmergencyAction = useCallback((action) => {
    postAlert(action, {
      phone: action === 'emergency' ? settings.emergencyPhone : settings.caregiverPhone,
      message: messageText || '',
    });
    startCooldown(action);
    setEmergencyModal(null);
  }, [startCooldown, settings, messageText]);

  return (
    <>
      <div
        style={{
          height: '100%',
          background: 'var(--bg-surface)',
          borderLeft: '1px solid var(--border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          padding: 'var(--sp-3)',
          gap: 'var(--sp-3)',
          overflow: 'hidden',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)' }}>
          <DwellButton
            label="Speak"
            variant="action"
            size="lg"
            ariaLabel="Speak the composed message"
            onSelect={() => { if (messageText) speak(messageText); }}
            style={{ width: '100%' }}
          />
          <DwellButton
            label="Clear"
            variant="key"
            size="md"
            ariaLabel="Clear the message"
            onSelect={clearMessage}
            style={{ width: '100%' }}
          />
          <DwellButton
            label={'\u232B'}
            variant="key"
            size="md"
            ariaLabel="Backspace - remove last character"
            onSelect={backspaceMessage}
            style={{ width: '100%', fontSize: 'var(--text-xl)' }}
          />
        </div>

        <div
          style={{
            borderTop: '1px solid var(--border-subtle)',
            paddingTop: 'var(--sp-3)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--sp-2)',
          }}
        >
          <EmergencyPanel onAction={(actionType) => setEmergencyModal(actionType)} cooldown={emergencyCooldown} />
        </div>

        <section aria-label="How iComm works" style={{ marginTop: 'auto', paddingTop: 'var(--sp-3)' }}>
          <div
            style={{
              fontSize: 'var(--text-xs)',
              color: 'var(--text-hint)',
              lineHeight: 1.5,
              padding: 'var(--sp-2)',
              background: 'var(--bg-key)',
              borderRadius: 'var(--radius-md)',
            }}
          >
            <strong style={{ color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
              How iComm works
            </strong>
            Your eye movements are tracked by the webcam. Look at letters, words, or buttons to select them. Selected text is spoken out loud using text-to-speech.
          </div>
        </section>
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
