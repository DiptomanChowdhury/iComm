import React, { useState } from 'react';
import { useSettingsContext } from '../../context/SettingsContext';

export default React.memo(function PhraseEditor() {
  const { settings, updateSetting } = useSettingsContext();
  const [newPhrase, setNewPhrase] = useState('');
  const [editIdx, setEditIdx] = useState(-1);
  const [editText, setEditText] = useState('');

  const handleAdd = () => {
    if (!newPhrase.trim()) return;
    const updated = [...(settings.customPhrases || []), { en: newPhrase.trim(), hi: newPhrase.trim() }];
    updateSetting('customPhrases', updated);
    setNewPhrase('');
  };

  const handleDelete = (idx) => {
    const updated = (settings.customPhrases || []).filter((_, i) => i !== idx);
    updateSetting('customPhrases', updated);
    if (editIdx === idx) {
      setEditIdx(-1);
      setEditText('');
    }
  };

  const handleSaveEdit = (idx) => {
    if (!editText.trim()) return;
    const updated = [...(settings.customPhrases || [])];
    updated[idx] = { en: editText.trim(), hi: editText.trim() };
    updateSetting('customPhrases', updated);
    setEditIdx(-1);
    setEditText('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)' }}>
      <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', fontWeight: 500 }}>
        Custom Phrases
      </span>

      <div style={{ display: 'flex', gap: 'var(--sp-2)' }}>
        <input
          type="text"
          value={newPhrase}
          onChange={(e) => setNewPhrase(e.target.value)}
          placeholder="Add a new phrase..."
          aria-label="New custom phrase"
          style={{
            flex: 1,
            background: 'var(--bg-key)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '8px 12px',
            color: 'var(--text-primary)',
            fontSize: 'var(--text-sm)',
            fontFamily: 'var(--font-ui)',
            outline: 'none',
          }}
          onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); }}
        />
        <button
          type="button"
          onClick={handleAdd}
          style={{
            padding: '8px 16px',
            background: 'var(--accent-blue)',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            cursor: 'pointer',
            fontWeight: 500,
            fontSize: 'var(--text-sm)',
          }}
        >
          Add
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 200, overflow: 'auto' }}>
        {(settings.customPhrases || []).length === 0 && (
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', padding: 'var(--sp-2)' }}>
            No custom phrases yet.
          </span>
        )}
        {(settings.customPhrases || []).map((phrase, idx) => (
          <div
            key={idx}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--sp-2)',
              padding: '6px 8px',
              background: 'var(--bg-key)',
              borderRadius: 'var(--radius-sm)',
            }}
          >
            {editIdx === idx ? (
              <>
                <input
                  type="text"
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  aria-label="Edit phrase"
                  style={{
                    flex: 1,
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '4px 8px',
                    color: 'var(--text-primary)',
                    fontSize: 'var(--text-xs)',
                    fontFamily: 'var(--font-ui)',
                    outline: 'none',
                  }}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSaveEdit(idx); }}
                />
                <button type="button" onClick={() => handleSaveEdit(idx)} style={smallBtnStyle}>Save</button>
                <button type="button" onClick={() => setEditIdx(-1)} style={{ ...smallBtnStyle, background: 'var(--text-hint)' }}>Cancel</button>
              </>
            ) : (
              <>
                <span style={{ flex: 1, fontSize: 'var(--text-xs)', color: 'var(--text-primary)' }}>{phrase.en}</span>
                <button type="button" onClick={() => { setEditIdx(idx); setEditText(phrase.en); }} style={smallBtnStyle}>Edit</button>
                <button type="button" onClick={() => handleDelete(idx)} style={{ ...smallBtnStyle, background: 'var(--accent-red-dim)' }}>Del</button>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
});

const smallBtnStyle = {
  padding: '3px 8px',
  fontSize: 'var(--text-xs)',
  background: 'var(--accent-blue-dim)',
  color: '#FFFFFF',
  border: 'none',
  borderRadius: 'var(--radius-sm)',
  cursor: 'pointer',
  fontWeight: 500,
};
