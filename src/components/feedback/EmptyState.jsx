import React from 'react';

export default React.memo(function EmptyState({ icon, title, message }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 'var(--sp-3)',
        padding: 'var(--sp-8)',
        textAlign: 'center',
      }}
    >
      {icon && <span style={{ fontSize: 48, opacity: 0.5 }}>{icon}</span>}
      {title && (
        <h3 style={{ fontSize: 'var(--text-lg)', color: 'var(--text-muted)', fontWeight: 500 }}>
          {title}
        </h3>
      )}
      {message && (
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-hint)', maxWidth: 300 }}>
          {message}
        </p>
      )}
    </div>
  );
});
