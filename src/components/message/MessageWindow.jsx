import React, { useRef, useEffect } from 'react';

export default React.memo(function MessageWindow({ text }) {
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [text]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-1)' }}>
      <span
        style={{
          fontSize: 'var(--text-xs)',
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          fontWeight: 500,
        }}
      >
        Message Window
      </span>
      <div
        ref={scrollRef}
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--sp-4) var(--sp-5)',
          minHeight: 64,
          maxHeight: 96,
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        {text ? (
          <span style={{ fontSize: 'var(--text-2xl)', color: 'var(--text-primary)', lineHeight: 1.4, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {text}
            <span
              style={{
                display: 'inline-block',
                width: 2,
                height: '1.2em',
                background: 'var(--accent-green)',
                marginLeft: 2,
                verticalAlign: 'text-bottom',
                animation: 'dwell-pulse 1s step-end infinite',
              }}
              aria-hidden="true"
            />
          </span>
        ) : (
          <span style={{ fontSize: 'var(--text-base)', color: 'var(--text-muted)', fontStyle: 'italic' }}>
            Look at a key or phrase to begin typing...
          </span>
        )}
      </div>
    </div>
  );
});
