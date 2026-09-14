import { useState, useMemo } from 'react';
import type { HtmlElementDefinition } from '@aurora/ui';
import { useAurora } from './context.js';

export function AuroraHtmlElementPicker() {
  const {
    isElementPickerOpen,
    setElementPickerOpen,
    registry,
    insert,
    evaluateElement,
    toggleFavorite,
    getFavorites,
    getRecentElements,
    context
  } = useAurora();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'suggested' | 'favorites' | 'recent'>('all');

  const allElements = useMemo(() => registry.getAll(), [registry]);

  const displayedElements = useMemo(() => {
    if (searchQuery.trim()) {
      return registry.search(searchQuery);
    }

    if (activeTab === 'favorites') {
      const favs = getFavorites();
      return favs.map((t) => registry.get(t)).filter((d): d is HtmlElementDefinition => !!d);
    }

    if (activeTab === 'recent') {
      const recents = getRecentElements();
      return recents.map((t) => registry.get(t)).filter((d): d is HtmlElementDefinition => !!d);
    }

    if (activeTab === 'suggested') {
      return registry.getAvailable(context).sort((a, b) => {
        const scoreA = evaluateElement(a).score;
        const scoreB = evaluateElement(b).score;
        return scoreB - scoreA;
      });
    }

    return [...allElements].sort((a, b) => a.tagName.localeCompare(b.tagName));
  }, [searchQuery, activeTab, registry, getFavorites, getRecentElements, context, evaluateElement, allElements]);

  if (!isElementPickerOpen) return null;

  const close = () => setElementPickerOpen(false);

  const select = (def: HtmlElementDefinition) => {
    insert(def);
    close();
  };

  const isFav = (tag: string) => getFavorites().includes(tag.toLowerCase());

  return (
    <div
      className="aurora-modal-overlay"
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(15, 23, 42, 0.6)',
        backdropFilter: 'blur(4px)',
        zIndex: 200000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
      onClick={close}
    >
      <div
        className="aurora-modal-container"
        style={{
          background: 'white',
          width: '720px',
          maxWidth: '92vw',
          maxHeight: '85vh',
          borderRadius: '12px',
          boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          borderBottom: '1px solid #e2e8f0'
        }}>
          <h3 style={{ margin: 0, fontSize: '18px', color: '#0f172a' }}>
            🧩 All HTML Elements Picker
          </h3>
          <button
            type="button"
            style={{ border: 'none', background: 'transparent', fontSize: '18px', cursor: 'pointer', color: '#64748b' }}
            onClick={close}
          >
            ✕
          </button>
        </div>

        {/* Search Input */}
        <div style={{ padding: '12px 20px', borderBottom: '1px solid #e2e8f0' }}>
          <input
            type="text"
            placeholder="Search elements by tag, name, aliases, or category (e.g., details, table, quote)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 14px',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              fontSize: '14px',
              outline: 'none',
              boxSizing: 'border-box'
            }}
            autoFocus
          />
        </div>

        {/* Section Tabs */}
        <div style={{ display: 'flex', padding: '8px 20px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', gap: '8px' }}>
          {(['all', 'suggested', 'favorites', 'recent'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              style={{
                border: '1px solid transparent',
                background: activeTab === tab ? 'white' : 'transparent',
                borderColor: activeTab === tab ? '#cbd5e1' : 'transparent',
                fontWeight: activeTab === tab ? 600 : 'normal',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '13px',
                cursor: 'pointer',
                color: activeTab === tab ? '#0f172a' : '#475569'
              }}
              onClick={() => setActiveTab(tab)}
            >
              {tab === 'all' && `Alphabetical (${allElements.length})`}
              {tab === 'suggested' && '★ Suggested for Context'}
              {tab === 'favorites' && '♥ Favorites'}
              {tab === 'recent' && '⏱ Recently Used'}
            </button>
          ))}
        </div>

        {/* Elements Grid */}
        <div style={{
          padding: '16px 20px',
          overflowY: 'auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: '12px',
          maxHeight: '50vh'
        }}>
          {displayedElements.length === 0 && (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: '#64748b' }}>
              No matching HTML elements found.
            </div>
          )}
          {displayedElements.map((def) => (
            <div
              key={def.tagName}
              style={{
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '12px',
                cursor: 'pointer',
                background: '#ffffff',
                display: 'flex',
                flexDirection: 'column'
              }}
              onClick={() => select(def)}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontFamily: 'monospace', fontSize: '12px', fontWeight: 'bold', color: '#6366f1' }}>
                  &lt;{def.tagName}&gt;
                </span>
                <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: '#f1f5f9', color: '#475569', textTransform: 'uppercase' }}>
                  {def.category}
                </span>
                <button
                  type="button"
                  style={{
                    border: 'none',
                    background: 'transparent',
                    color: isFav(def.tagName) ? '#eab308' : '#cbd5e1',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(def.tagName);
                  }}
                >
                  ★
                </button>
              </div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#1e293b', marginBottom: '4px' }}>
                {def.displayName}
              </div>
              <div style={{ fontSize: '11px', color: '#64748b', lineHeight: 1.4 }}>
                {def.description}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
