import { useState, useMemo } from 'react';
import type { HtmlElementDefinition } from '@aurora/ui';
import { useAurora } from './context.js';

export function AuroraMobileActions() {
  const { editor, registry, insert, getFavorites } = useAurora();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const favoriteElements = useMemo(() => {
    const favs = getFavorites();
    return favs.map((t) => registry.get(t)).filter((d): d is HtmlElementDefinition => !!d);
  }, [registry, getFavorites]);

  const displayedElements = useMemo(() => {
    if (searchQuery.trim()) {
      return registry.search(searchQuery);
    }
    return registry.getAll().slice(0, 20);
  }, [registry, searchQuery]);

  const exec = (command: string, input?: unknown) => {
    editor?.execute(command, input);
  };

  const select = (def: HtmlElementDefinition) => {
    insert(def);
    setIsSheetOpen(false);
  };

  return (
    <>
      <div
        className="aurora-mobile-bar"
        role="toolbar"
        aria-label="Mobile Quick Actions"
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          height: '52px',
          background: '#ffffff',
          borderTop: '1px solid #cbd5e1',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-around',
          padding: '0 8px',
          boxShadow: '0 -2px 10px rgba(0,0,0,0.06)',
          zIndex: 99999
        }}
      >
        <button type="button" className="aurora-mob-btn" onClick={() => exec('toggleBold')} title="Bold"><b>B</b></button>
        <button type="button" className="aurora-mob-btn" onClick={() => exec('toggleItalic')} title="Italic"><i>I</i></button>
        <button type="button" className="aurora-mob-btn" onClick={() => exec('setHeading', { level: 2 })} title="Heading">H2</button>
        <button type="button" className="aurora-mob-btn" onClick={() => exec('toggleBulletList')} title="List">•≡</button>
        <button
          type="button"
          className="aurora-mob-btn aurora-mob-insert-btn"
          style={{ background: '#6366f1', color: 'white', fontWeight: 600, maxWidth: '80px', borderRadius: '6px' }}
          onClick={() => setIsSheetOpen(true)}
          title="Insert HTML Elements"
        >
          + Add
        </button>
      </div>

      {isSheetOpen && (
        <div
          className="aurora-sheet-backdrop"
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(15, 23, 42, 0.6)',
            zIndex: 230000,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end'
          }}
          onClick={() => setIsSheetOpen(false)}
        >
          <div
            className="aurora-sheet-container"
            style={{
              background: 'white',
              borderTopLeftRadius: '16px',
              borderTopRightRadius: '16px',
              maxHeight: '85vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 -10px 25px rgba(0,0,0,0.2)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ width: '40px', height: '4px', background: '#cbd5e1', borderRadius: '2px', margin: '8px auto 4px auto' }} />

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', borderBottom: '1px solid #e2e8f0' }}>
              <h4 style={{ margin: 0, fontSize: '16px', color: '#0f172a' }}>Insert HTML Element</h4>
              <button
                type="button"
                style={{ border: 'none', background: 'transparent', fontSize: '18px', color: '#64748b', cursor: 'pointer' }}
                onClick={() => setIsSheetOpen(false)}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: '10px 16px', borderBottom: '1px solid #e2e8f0' }}>
              <input
                type="text"
                placeholder="Search all elements..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', boxSizing: 'border-box', fontSize: '14px' }}
              />
            </div>

            <div style={{ padding: '12px 16px', overflowY: 'auto', maxHeight: '60vh' }}>
              {!searchQuery.trim() && (
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 'bold', color: '#64748b', marginBottom: '8px' }}>
                    Favorites
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {favoriteElements.map((fav) => (
                      <button
                        key={fav.tagName}
                        type="button"
                        style={{ padding: '6px 10px', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '20px', fontSize: '12px', cursor: 'pointer' }}
                        onClick={() => select(fav)}
                      >
                        &lt;{fav.tagName}&gt; {fav.displayName}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <div style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 'bold', color: '#64748b', marginBottom: '8px' }}>
                  {searchQuery.trim() ? 'Search Results' : 'All Elements'}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {displayedElements.map((def) => (
                    <button
                      key={def.tagName}
                      type="button"
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        padding: '10px 12px',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        background: 'white',
                        textAlign: 'left',
                        cursor: 'pointer'
                      }}
                      onClick={() => select(def)}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                        <span style={{ fontFamily: 'monospace', fontSize: '11px', fontWeight: 'bold', color: '#6366f1' }}>
                          &lt;{def.tagName}&gt;
                        </span>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: '#1e293b' }}>
                          {def.displayName}
                        </span>
                      </div>
                      <span style={{ fontSize: '11px', color: '#64748b' }}>
                        {def.description}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
