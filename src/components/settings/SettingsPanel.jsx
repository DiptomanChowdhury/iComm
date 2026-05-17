import React, { useState, useCallback } from 'react';
import SliderControl from './SliderControl';
import PhraseEditor from './PhraseEditor';
import { useSettingsContext } from '../../context/SettingsContext';

export default React.memo(function SettingsPanel({ onClose, onOpenCalibration }) {
  const [pin, setPin] = useState('');
  const [isAuthed, setIsAuthed] = useState(false);
  const [voices, setVoices] = useState([]);
  const [changePin, setChangePin] = useState({ current: '', newPin: '', confirm: '' });
  const [pinMsg, setPinMsg] = useState('');
  const { settings, updateSetting } = useSettingsContext();

  React.useEffect(() => {
    const loadVoices = () => {
      const v = window.speechSynthesis.getVoices();
      setVoices(v);
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    return () => { window.speechSynthesis.onvoiceschanged = null; };
  }, []);

  const handlePinSubmit = useCallback(() => {
    if (pin === settings.settingsPin) {
      setIsAuthed(true);
    } else {
      setPin('');
    }
  }, [pin, settings.settingsPin]);

  if (!isAuthed) {
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
        <h2 style={{ fontSize: 'var(--text-xl)', color: 'var(--text-primary)' }}>Settings</h2>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>Enter PIN to access settings</p>
        <input
          type="password"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          maxLength={4}
          placeholder="0000"
          aria-label="Settings PIN"
          style={{
            width: 120,
            padding: '10px 16px',
            textAlign: 'center',
            fontSize: 'var(--text-xl)',
            background: 'var(--bg-key)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--text-primary)',
            fontFamily: 'monospace',
            outline: 'none',
            letterSpacing: 8,
          }}
          onKeyDown={(e) => { if (e.key === 'Enter') handlePinSubmit(); }}
        />
        <button
          type="button"
          onClick={handlePinSubmit}
          style={{
            padding: '8px 24px',
            background: 'var(--accent-blue)',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: 'var(--text-base)',
          }}
        >
          Unlock
        </button>
        <button
          type="button"
          onClick={onClose}
          style={{
            padding: '6px 16px',
            background: 'transparent',
            color: 'var(--text-muted)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            cursor: 'pointer',
            fontSize: 'var(--text-sm)',
          }}
        >
          Cancel
        </button>
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
        overflow: 'auto',
        padding: 'var(--sp-6)',
      }}
    >
      <div
        style={{
          background: 'var(--bg-surface)',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--border-subtle)',
          padding: 'var(--sp-6)',
          maxWidth: 560,
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--sp-5)',
          maxHeight: '90vh',
          overflow: 'auto',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: 'var(--text-xl)', color: 'var(--text-primary)' }}>Settings</h2>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-muted)',
              padding: '4px 12px',
              cursor: 'pointer',
              fontSize: 'var(--text-sm)',
            }}
          >
            Close
          </button>
        </div>

        <section style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
          <h3 style={{ fontSize: 'var(--text-base)', color: 'var(--accent-green)', fontWeight: 600 }}>Gaze Settings</h3>
          <SliderControl
            label="Dwell Time"
            value={settings.dwellTime}
            min={500}
            max={3000}
            step={100}
            onChange={(v) => updateSetting('dwellTime', v)}
            unit="ms"
          />
          <SliderControl
            label="Gaze Smoothing"
            value={settings.gazeAlpha}
            min={0.1}
            max={0.9}
            step={0.1}
            onChange={(v) => updateSetting('gazeAlpha', v)}
          />
          <button
            type="button"
            onClick={onOpenCalibration}
            style={{
              padding: '8px 16px',
              background: 'var(--accent-green)',
              color: '#0D1B2A',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: 'var(--text-sm)',
              alignSelf: 'flex-start',
            }}
          >
            Recalibrate
          </button>
        </section>

        <div style={{ height: 1, background: 'var(--border-subtle)' }} />

        <section style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
          <h3 style={{ fontSize: 'var(--text-base)', color: 'var(--accent-green)', fontWeight: 600 }}>Speech Settings</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-1)' }}>
            <label htmlFor="speech-voice" style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>Voice</label>
            <select
              id="speech-voice"
              value={settings.speechVoice ? settings.speechVoice.name : ''}
              onChange={(e) => {
                const voice = voices.find(v => v.name === e.target.value) || null;
                updateSetting('speechVoice', voice);
              }}
              aria-label="Speech voice"
              style={{
                background: 'var(--bg-key)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '8px 12px',
                color: 'var(--text-primary)',
                fontSize: 'var(--text-sm)',
                fontFamily: 'var(--font-ui)',
                outline: 'none',
              }}
            >
              <option value="">Default Voice</option>
              {voices.map((v) => (
                <option key={v.name} value={v.name}>{v.name} ({v.lang})</option>
              ))}
            </select>
          </div>
          <SliderControl
            label="Speech Rate"
            value={settings.speechRate}
            min={0.5}
            max={1.5}
            step={0.1}
            onChange={(v) => updateSetting('speechRate', v)}
          />
          <SliderControl
            label="Speech Pitch"
            value={settings.speechPitch}
            min={0.5}
            max={1.5}
            step={0.1}
            onChange={(v) => updateSetting('speechPitch', v)}
          />
        </section>

        <div style={{ height: 1, background: 'var(--border-subtle)' }} />

        <section style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
          <h3 style={{ fontSize: 'var(--text-base)', color: 'var(--accent-green)', fontWeight: 600 }}>Language</h3>
          <div style={{ display: 'flex', gap: 'var(--sp-2)' }}>
            <button
              type="button"
              onClick={() => updateSetting('language', 'en')}
              style={{
                padding: '8px 20px',
                background: settings.language === 'en' ? 'var(--accent-blue)' : 'var(--bg-key)',
                color: '#FFFFFF',
                border: `1px solid ${settings.language === 'en' ? 'var(--accent-blue)' : 'var(--border-subtle)'}`,
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                fontWeight: settings.language === 'en' ? 600 : 400,
                fontSize: 'var(--text-sm)',
              }}
            >
              English
            </button>
            <button
              type="button"
              onClick={() => updateSetting('language', 'hi')}
              style={{
                padding: '8px 20px',
                background: settings.language === 'hi' ? 'var(--accent-blue)' : 'var(--bg-key)',
                color: '#FFFFFF',
                border: `1px solid ${settings.language === 'hi' ? 'var(--accent-blue)' : 'var(--border-subtle)'}`,
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                fontWeight: settings.language === 'hi' ? 600 : 400,
                fontSize: 'var(--text-sm)',
              }}
            >
              \u0939\u093F\u0928\u094D\u0926\u0940 (Hindi)
            </button>
          </div>
        </section>

        <div style={{ height: 1, background: 'var(--border-subtle)' }} />

        <section style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
          <h3 style={{ fontSize: 'var(--text-base)', color: 'var(--accent-green)', fontWeight: 600 }}>Emergency Contacts</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)' }}>
            {[
              { key: 'emergencyPhone', label: 'Emergency Phone' },
              { key: 'caregiverPhone', label: 'Caregiver WhatsApp' },
            ].map((field) => (
              <div key={field.key} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label htmlFor={`contact-${field.key}`} style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{field.label}</label>
                <input
                  id={`contact-${field.key}`}
                  type="text"
                  value={settings[field.key]}
                  onChange={(e) => updateSetting(field.key, e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  aria-label={field.label}
                  style={{
                    background: 'var(--bg-key)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: '8px 12px',
                    color: 'var(--text-primary)',
                    fontSize: 'var(--text-sm)',
                    fontFamily: 'var(--font-ui)',
                    outline: 'none',
                  }}
                />
              </div>
            ))}
          </div>
        </section>

        <div style={{ height: 1, background: 'var(--border-subtle)' }} />

        <section style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
          <h3 style={{ fontSize: 'var(--text-base)', color: 'var(--accent-green)', fontWeight: 600 }}>Change PIN</h3>
          {pinMsg && <span style={{ fontSize: 'var(--text-xs)', color: pinMsg.includes('success') ? 'var(--accent-green)' : 'var(--accent-red)' }}>{pinMsg}</span>}
          <input
            type="password" placeholder="Current PIN" maxLength={4}
            value={changePin.current}
            onChange={(e) => setChangePin(prev => ({ ...prev, current: e.target.value }))}
            aria-label="Current PIN"
            style={{ background: 'var(--bg-key)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '8px 12px', color: 'var(--text-primary)', fontSize: 'var(--text-sm)', fontFamily: 'monospace', outline: 'none', letterSpacing: 4 }}
          />
          <input
            type="password" placeholder="New PIN" maxLength={4}
            value={changePin.newPin}
            onChange={(e) => setChangePin(prev => ({ ...prev, newPin: e.target.value }))}
            aria-label="New PIN"
            style={{ background: 'var(--bg-key)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '8px 12px', color: 'var(--text-primary)', fontSize: 'var(--text-sm)', fontFamily: 'monospace', outline: 'none', letterSpacing: 4 }}
          />
          <input
            type="password" placeholder="Confirm new PIN" maxLength={4}
            value={changePin.confirm}
            onChange={(e) => setChangePin(prev => ({ ...prev, confirm: e.target.value }))}
            aria-label="Confirm new PIN"
            style={{ background: 'var(--bg-key)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '8px 12px', color: 'var(--text-primary)', fontSize: 'var(--text-sm)', fontFamily: 'monospace', outline: 'none', letterSpacing: 4 }}
          />
          <button
            type="button"
            onClick={() => {
              if (changePin.current !== settings.settingsPin) {
                setPinMsg('Current PIN is incorrect');
              } else if (changePin.newPin !== changePin.confirm) {
                setPinMsg('New PINs do not match');
              } else if (changePin.newPin.length !== 4) {
                setPinMsg('New PIN must be exactly 4 digits');
              } else {
                updateSetting('settingsPin', changePin.newPin);
                setPinMsg('PIN changed successfully');
                setChangePin({ current: '', newPin: '', confirm: '' });
              }
            }}
            style={{ padding: '8px 16px', background: 'var(--accent-blue)', color: '#FFFFFF', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontWeight: 600, fontSize: 'var(--text-sm)', alignSelf: 'flex-start' }}
          >
            Save PIN
          </button>
        </section>

        <div style={{ height: 1, background: 'var(--border-subtle)' }} />

        <PhraseEditor />
      </div>
    </div>
  );
});
