import { useState, useEffect, useMemo } from 'react';
import { useAurora } from './context.js';

interface PaletteAction {
  id: string;
  title: string;
  category: string;
  description: string;
  shortcut?: string;
  icon?: string;
  execute: () => void;
}

export function AuroraCommandPalette() {
  const {
    isCommandPaletteOpen,
    setCommandPaletteOpen,
    setElementPickerOpen,
    editor,
    registry,
    insert
  } = useAurora();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const baseActions = useMemo<PaletteAction[]>(() => [
    {
      id: 'cmd-undo',
      title: 'Undo',
      category: 'Edit',
      description: 'Revert previous change',
      shortcut: 'Ctrl+Z',
      execute: () => editor?.execute('undo')
    },
    {
      id: 'cmd-redo',
      title: 'Redo',
      category: 'Edit',
      description: 'Reapply undone change',
      shortcut: 'Ctrl+Y',
      execute: () => editor?.execute('redo')
    },
    {
      id: 'cmd-bold',
      title: 'Bold',
      category: 'Format',
      description: 'Toggle bold emphasis',
      shortcut: 'Ctrl+B',
      execute: () => editor?.execute('toggleBold')
    },
    {
      id: 'cmd-italic',
      title: 'Italic',
      category: 'Format',
      description: 'Toggle italic emphasis',
      shortcut: 'Ctrl+I',
      execute: () => editor?.execute('toggleItalic')
    },
    {
      id: 'cmd-table',
      title: 'Insert Table',
      category: 'Tables',
      description: 'Insert 3x3 table with headers',
      execute: () => editor?.execute('insertTable', { rows: 3, columns: 3 })
    },
    {
      id: 'cmd-picker',
      title: 'Open HTML Element Picker',
      category: 'Insert',
      description: 'Explore full library of HTML5 elements',
      execute: () => setElementPickerOpen(true)
    }
  ], [editor, setElementPickerOpen]);

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    const elementActions: PaletteAction[] = registry.getAll().map((def) => ({
      id: `elem-${def.tagName}`,
      title: `<${def.tagName}> (${def.displayName})`,
      category: `HTML: ${def.category}`,
      description: def.description,
      icon: '🏷️',
      execute: () => insert(def)
    }));

    const all = [...baseActions, ...elementActions];
    if (!q) return all.slice(0, 12);

    return all.filter((item) =>
      item.title.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q)
    ).slice(0, 15);
  }, [searchQuery, registry, baseActions, insert]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredItems]);

  // Global Ctrl+K / Cmd+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(!isCommandPaletteOpen);
        return;
      }

      if (!isCommandPaletteOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredItems.length));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % Math.max(1, filteredItems.length));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredItems[selectedIndex]) {
          filteredItems[selectedIndex].execute();
          setCommandPaletteOpen(false);
        }
      } else if (e.key === 'Escape') {
        setCommandPaletteOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCommandPaletteOpen, setCommandPaletteOpen, filteredItems, selectedIndex]);

  if (!isCommandPaletteOpen) return null;

  const close = () => setCommandPaletteOpen(false);

  const selectItem = (item: PaletteAction) => {
    item.execute();
    close();
  };

  return (
    <div
      className="aurora-palette-overlay"
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(15, 23, 42, 0.55)',
        backdropFilter: 'blur(4px)',
        zIndex: 220000,
        display: 'flex',
        justifyContent: 'center',
        paddingTop: '12vh'
      }}
      onClick={close}
    >
      <div
        className="aurora-palette-box"
        style={{
          width: '580px',
          maxWidth: '90vw',
          background: 'white',
          borderRadius: '10px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '60vh'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', padding: '14px 18px', borderBottom: '1px solid #e2e8f0', gap: '10px' }}>
          <span style={{ fontSize: '16px' }}>🔍</span>
          <input
            type="text"
            placeholder="Type a command, element tag, or action... (Esc to cancel)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ flex: 1, border: 'none', outline: 'none', fontSize: '16px', color: '#0f172a' }}
            autoFocus
          />
        </div>

        <div style={{ overflowY: 'auto', padding: '6px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {filteredItems.length === 0 && (
            <div style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>
              No matching commands or elements found.
            </div>
          )}
          {filteredItems.map((item, i) => (
            <button
              key={item.id}
              type="button"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 12px',
                border: 'none',
                background: i === selectedIndex ? '#f1f5f9' : 'transparent',
                borderRadius: '6px',
                cursor: 'pointer',
                textAlign: 'left'
              }}
              onClick={() => selectItem(item)}
              onMouseEnter={() => setSelectedIndex(i)}
            >
              <span style={{ fontSize: '14px' }}>{item.icon || '⚡'}</span>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '14px', fontWeight: 600, color: '#1e293b' }}>
                  {item.title}
                </span>
                <span style={{ fontSize: '11px', color: '#64748b' }}>
                  {item.description}
                </span>
              </div>
              <span style={{ fontSize: '10px', background: '#e2e8f0', padding: '2px 6px', borderRadius: '4px', textTransform: 'uppercase', color: '#475569' }}>
                {item.category}
              </span>
              {item.shortcut && (
                <span style={{ fontFamily: 'monospace', fontSize: '11px', background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '2px 6px', borderRadius: '4px', color: '#64748b' }}>
                  {item.shortcut}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
