import { useState, useEffect, useMemo } from 'react';
import { useAurora } from './context.js';

export interface AuroraSlashCommandMenuProps {
  query?: string;
  top?: number;
  left?: number;
  isOpen: boolean;
  onClose?: () => void;
}

export function AuroraSlashCommandMenu({
  query = '',
  top = 0,
  left = 0,
  isOpen,
  onClose
}: AuroraSlashCommandMenuProps) {
  const { registry, insert } = useAurora();
  const [selectedIndex, setSelectedIndex] = useState(0);

  const filteredCommands = useMemo(() => {
    if (!query.trim()) {
      return registry.getAll().filter((d) => d.menu.visibleInStandard).slice(0, 8);
    }
    return registry.search(query).slice(0, 8);
  }, [registry, query]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredCommands]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredCommands.length));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % Math.max(1, filteredCommands.length));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          insert(filteredCommands[selectedIndex]);
          onClose?.();
        }
      } else if (e.key === 'Escape') {
        onClose?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredCommands, selectedIndex, insert, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="aurora-slash-popup"
      style={{
        position: 'fixed',
        zIndex: 210000,
        width: '280px',
        background: 'white',
        border: '1px solid #cbd5e1',
        borderRadius: '8px',
        boxShadow: '0 10px 20px rgba(0,0,0,0.12)',
        overflow: 'hidden',
        top: `${top}px`,
        left: `${left}px`
      }}
    >
      <div style={{ padding: '6px 10px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontSize: '11px', color: '#64748b', fontWeight: 600 }}>
        Insert element (/{query})
      </div>
      <div style={{ maxHeight: '240px', overflowY: 'auto', padding: '4px' }}>
        {filteredCommands.length === 0 && (
          <div style={{ padding: '12px', textAlign: 'center', fontSize: '12px', color: '#94a3b8' }}>
            No matching elements
          </div>
        )}
        {filteredCommands.map((def, i) => (
          <button
            key={def.tagName}
            type="button"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              width: '100%',
              padding: '6px 8px',
              border: 'none',
              background: i === selectedIndex ? '#f1f5f9' : 'transparent',
              borderRadius: '4px',
              cursor: 'pointer',
              textAlign: 'left'
            }}
            onClick={() => {
              insert(def);
              onClose?.();
            }}
            onMouseEnter={() => setSelectedIndex(i)}
          >
            <span style={{ fontFamily: 'monospace', fontSize: '11px', fontWeight: 'bold', color: '#6366f1', minWidth: '48px' }}>
              &lt;{def.tagName}&gt;
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#1e293b' }}>
                {def.displayName}
              </span>
              <span style={{ fontSize: '10px', color: '#64748b', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                {def.description}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
