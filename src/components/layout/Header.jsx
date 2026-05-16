import React from 'react';
import { useGazeContext } from '../../context/GazeContext';
import { useSettingsContext } from '../../context/SettingsContext';
import StatusBar from './StatusBar';

export default React.memo(function Header({ onOpenSettings }) {
  const { connected, hasFace } = useGazeContext();
  const { settings } = useSettingsContext();

  return (
    <header
      style={{
        height: 'var(--header-height)',
        background: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 var(--sp-4)',
        gap: 'var(--sp-4)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none" role="img" aria-label="iComm logo">
          <circle cx="14" cy="14" r="13" stroke="#00E676" strokeWidth="2" fill="#0D1B2A" />
          <text x="14" y="19" textAnchor="middle" fill="#00E676" fontSize="14" fontWeight="bold" fontFamily="Inter, sans-serif">iC</text>
        </svg>
        <span style={{ fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--text-primary)' }}>
          iComm
        </span>
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', display: 'none' }}>
          Empowering voices.
        </span>
      </div>

      <StatusBar
        connected={connected}
        hasFace={hasFace}
        calibrated={settings.calibrated}
      />

      <button
        type="button"
        onClick={onOpenSettings}
        aria-label="Open settings"
        style={{
          background: 'transparent',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          color: 'var(--text-muted)',
          width: 32,
          height: 32,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          fontSize: 'var(--text-lg)',
          transition: 'color 0.15s, border-color 0.15s',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.borderColor = 'var(--text-muted)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border-subtle)'; }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
        </svg>
      </button>
    </header>
  );
});
