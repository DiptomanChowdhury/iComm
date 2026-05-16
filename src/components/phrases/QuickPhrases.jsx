import React, { useState } from 'react';
import { PHRASE_CATEGORIES } from './phraseData';
import PhraseCard from './PhraseCard';
import DwellButton from '../core/DwellButton';
import { useSettingsContext } from '../../context/SettingsContext';

const PHRASES_PER_PAGE = 12;

export default React.memo(function QuickPhrases({ onSelect, onBack }) {
  const [activeCategory, setActiveCategory] = useState('basic');
  const [page, setPage] = useState(0);
  const { settings } = useSettingsContext();

  const categories = PHRASE_CATEGORIES.map(cat => {
    if (cat.id === 'custom') {
      return { ...cat, phrases: settings.customPhrases || [] };
    }
    return cat;
  });

  const currentCat = categories.find(c => c.id === activeCategory) || categories[0];
  const totalPages = Math.max(1, Math.ceil(currentCat.phrases.length / PHRASES_PER_PAGE));
  const safePage = Math.min(page, totalPages - 1);
  const pagePhrases = currentCat.phrases.slice(safePage * PHRASES_PER_PAGE, (safePage + 1) * PHRASES_PER_PAGE);

  const handleCategoryChange = (catId) => {
    setActiveCategory(catId);
    setPage(0);
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--sp-3)',
        flex: 1,
        overflow: 'hidden',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
        <DwellButton
          label={'\u2190 Back'}
          onSelect={onBack}
          size="sm"
          variant="key"
          ariaLabel="Back to keyboard"
          style={{ flexShrink: 0 }}
        />
        <div style={{ display: 'flex', gap: 4, overflow: 'hidden', flex: 1 }}>
          {categories.map((cat) => (
            <DwellButton
              key={cat.id}
              label={cat.label}
              onSelect={() => handleCategoryChange(cat.id)}
              size="sm"
              variant="key"
              ariaLabel={`Category: ${cat.label}`}
              style={{
                flex: '0 0 auto',
                background: activeCategory === cat.id ? 'var(--bg-surface-2)' : 'var(--bg-key)',
                border: activeCategory === cat.id ? '1px solid var(--border-focus)' : '1px solid var(--border-subtle)',
                fontWeight: activeCategory === cat.id ? 600 : 400,
              }}
            />
          ))}
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 'var(--sp-2)',
          flex: 1,
          alignContent: 'start',
          overflow: 'auto',
        }}
      >
        {pagePhrases.map((phrase, idx) => (
          <PhraseCard key={idx} phrase={phrase} onSelect={onSelect} />
        ))}
        {pagePhrases.length === 0 && (
          <div
            style={{
              gridColumn: '1 / -1',
              textAlign: 'center',
              padding: 'var(--sp-8)',
              color: 'var(--text-muted)',
              fontSize: 'var(--text-base)',
            }}
          >
            No phrases yet. Add some in Settings.
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--sp-3)', alignItems: 'center' }}>
          <DwellButton
            label="Prev"
            onSelect={() => setPage(p => Math.max(0, p - 1))}
            size="sm"
            variant="key"
            ariaLabel="Previous page"
            disabled={safePage === 0}
          />
          <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
            Page {safePage + 1} of {totalPages}
          </span>
          <DwellButton
            label="Next"
            onSelect={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            size="sm"
            variant="key"
            ariaLabel="Next page"
            disabled={safePage >= totalPages - 1}
          />
        </div>
      )}
    </div>
  );
});
