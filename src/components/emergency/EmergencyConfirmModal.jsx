import React, { useState, useEffect, useRef, useCallback } from 'react';
import DwellButton from '../core/DwellButton';

const QUICK_MESSAGES = [
  { en: 'I need help immediately', hi: '\u092E\u0941\u091D\u0947 \u0924\u0941\u0930\u0902\u0924 \u092E\u0926\u0926 \u091A\u093E\u0939\u093F\u090F' },
  { en: 'Please come here', hi: '\u0915\u0943\u092A\u092F\u093E \u092F\u0939\u093E\u0901 \u0906\u090F\u0902' },
  { en: 'I am not feeling well', hi: '\u092E\u0948\u0902 \u0920\u0940\u0915 \u092E\u0939\u0938\u0942\u0938 \u0928\u0939\u0940\u0902 \u0915\u0930 \u0930\u0939\u093E' },
  { en: 'Call the doctor', hi: '\u0921\u093E\u0915\u094D\u091F\u0930 \u0915\u094B \u092C\u0941\u0932\u093E\u0913' },
  { en: 'I am in danger', hi: '\u092E\u0948\u0902 \u0916\u0924\u0930\u0947 \u092E\u0947\u0902 \u0939\u0942\u0901' },
  { en: 'Everything is okay', hi: '\u0938\u092C \u0915\u0941\u091B \u0920\u0940\u0915 \u0939\u0948' },
];

const EMERGENCY_UTTERANCES = {
  emergency: 'Help! Emergency! I need immediate assistance!',
  caregiver: 'Alert: Caregiver needed',
};

export default React.memo(function EmergencyConfirmModal({ action, onConfirm, onCancel }) {
  const [subAction, setSubAction] = useState(null);
  const timeoutRef = useRef(null);

  useEffect(() => {
    timeoutRef.current = setTimeout(() => {
      onCancel();
    }, 10000);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [action, onCancel]);

  const handleConfirm = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    onConfirm(action);
  }, [action, onConfirm]);

  const handleQuickMsgConfirm = useCallback((msg) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    const utterance = new SpeechSynthesisUtterance(msg);
    utterance.lang = 'en-US';
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    fetch('http://localhost:8000/send-alert', { method: 'POST' }).catch(() => {});
    onConfirm('quickmsg');
  }, [onConfirm]);

  const handleCancel = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    onCancel();
  }, [onCancel]);

  if (action === 'quickmsg') {
    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: 'var(--bg-overlay)',
          zIndex: 'var(--z-modal)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 'var(--sp-4)',
        }}
      >
        <h2 style={{ fontSize: 'var(--text-xl)', color: 'var(--accent-yellow)', textAlign: 'center' }}>
          Quick Message
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--sp-3)', maxWidth: 500 }}>
          {QUICK_MESSAGES.map((msg, i) => (
            <DwellButton
              key={i}
              label={msg.en}
              onSelect={() => handleQuickMsgConfirm(msg.en)}
              size="md"
              variant="emergency"
              ariaLabel={`Quick message: ${msg.en}`}
              style={{ background: 'var(--bg-surface-2)', minHeight: 60, width: '100%' }}
            />
          ))}
        </div>
        <DwellButton
          label="Cancel"
          onSelect={handleCancel}
          size="md"
          variant="key"
          ariaLabel="Cancel quick message"
        />
      </div>
    );
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'var(--bg-overlay)',
        zIndex: 'var(--z-modal)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 'var(--sp-6)',
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 'var(--sp-3)' }}>
          {action === 'emergency' ? '\u26A0\uFE0F' : action === 'caregiver' ? '\uD83D\uDFE2' : '\uD83D\uDFE1'}
        </div>
        <h2 style={{ fontSize: 'var(--text-xl)', color: 'var(--text-primary)', marginBottom: 'var(--sp-2)' }}>
          Are you sure?
        </h2>
        <p style={{ fontSize: 'var(--text-base)', color: 'var(--text-muted)' }}>
          Dwell to confirm {action === 'emergency' ? 'Emergency Call' : action === 'caregiver' ? 'Caregiver Alert' : 'Quick Message'}
        </p>
      </div>
      <div style={{ display: 'flex', gap: 'var(--sp-4)' }}>
        <DwellButton
          label="CONFIRM"
          onSelect={handleConfirm}
          size="lg"
          variant="emergency"
          dwellTime={2500}
          ariaLabel={`Confirm ${action} action`}
          style={{
            background: 'var(--accent-red)',
            color: '#FFFFFF',
            fontWeight: 700,
            minWidth: 160,
            padding: '16px 32px',
          }}
        />
        <DwellButton
          label="CANCEL"
          onSelect={handleCancel}
          size="lg"
          variant="key"
          ariaLabel="Cancel and go back"
          style={{ minWidth: 160, padding: '16px 32px' }}
        />
      </div>
    </div>
  );
});
