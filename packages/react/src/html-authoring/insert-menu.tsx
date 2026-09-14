import { useState } from 'react';
import type { ElementCategory } from '@aurora/ui';
import { useAurora } from './context.js';

const CATEGORIES: ElementCategory[] = [
  'basic',
  'text',
  'heading',
  'structure',
  'lists',
  'links',
  'media',
  'tables',
  'forms',
  'interactive',
  'data-code',
  'custom'
];

export function AuroraInsertMenu() {
  const { registry, insert } = useAurora();
  const [selectedCategory, setSelectedCategory] = useState<ElementCategory>('basic');

  const items = registry.getByCategory(selectedCategory);

  const formatCategory = (cat: string) => {
    return cat.charAt(0).toUpperCase() + cat.slice(1).replace('-', ' ');
  };

  return (
    <div className="aurora-react-insert-menu-dropdown" style={{
      display: 'flex',
      background: 'white',
      border: '1px solid #cbd5e1',
      borderRadius: '8px',
      boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
      width: '480px',
      maxHeight: '400px',
      overflow: 'hidden'
    }}>
      <div className="aurora-insert-menu-categories" style={{
        width: '140px',
        background: '#f8fafc',
        borderRight: '1px solid #e2e8f0',
        padding: '6px',
        display: 'flex',
        flexDirection: 'column',
        gap: '2px'
      }}>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            className={`aurora-category-tab ${selectedCategory === cat ? 'active' : ''}`}
            style={{
              border: 'none',
              background: selectedCategory === cat ? '#e2e8f0' : 'transparent',
              fontWeight: selectedCategory === cat ? 600 : 'normal',
              padding: '8px 10px',
              borderRadius: '6px',
              textAlign: 'left',
              fontSize: '13px',
              cursor: 'pointer',
              color: selectedCategory === cat ? '#0f172a' : '#334155'
            }}
            onClick={() => setSelectedCategory(cat)}
          >
            {formatCategory(cat)}
          </button>
        ))}
      </div>

      <div className="aurora-insert-menu-items" style={{
        flex: 1,
        padding: '8px',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px'
      }}>
        {items.length === 0 && (
          <div style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>
            No elements available in this category
          </div>
        )}
        {items.map((def) => (
          <button
            key={def.tagName}
            type="button"
            className="aurora-insert-item"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              padding: '8px 10px',
              border: '1px solid transparent',
              borderRadius: '6px',
              background: 'transparent',
              textAlign: 'left',
              cursor: 'pointer'
            }}
            onClick={() => insert(def)}
          >
            <span style={{ fontFamily: 'monospace', fontSize: '11px', color: '#6366f1', fontWeight: 'bold' }}>
              &lt;{def.tagName}&gt;
            </span>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#1e293b' }}>
              {def.displayName}
            </span>
            <span style={{ fontSize: '11px', color: '#64748b' }}>
              {def.description}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
