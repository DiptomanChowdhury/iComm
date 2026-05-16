import React from 'react';

const STATUS_COLORS = {
  active: { bg: 'rgba(0,230,118,0.15)', dot: '#00E676', text: '#00E676' },
  inactive: { bg: 'rgba(84,110,122,0.2)', dot: '#546E7A', text: '#546E7A' },
  error: { bg: 'rgba(211,47,47,0.15)', dot: '#D32F2F', text: '#D32F2F' },
  warning: { bg: 'rgba(249,168,37,0.15)', dot: '#F9A825', text: '#F9A825' },
};

export default React.memo(function StatusPill({ label, status = 'inactive' }) {
  const colors = STATUS_COLORS[status] || STATUS_COLORS.inactive;

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '2px 10px',
        borderRadius: 'var(--radius-full)',
        fontSize: 'var(--text-xs)',
        fontWeight: 500,
        background: colors.bg,
        color: colors.text,
        border: `1px solid ${colors.bg}`,
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: colors.dot,
          flexShrink: 0,
          animation: status === 'active' ? 'dwell-pulse 2s ease-in-out infinite' : 'none',
        }}
      />
      {label}
    </span>
  );
});
