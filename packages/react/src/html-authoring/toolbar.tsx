import { useState, useEffect, useRef, type CSSProperties } from 'react';
import { calculateToolbarLayout, type ResponsiveCommandMetadata, type ResponsiveBreakpoint } from '@aurora/ui';
import { useAurora } from './context.js';

const ALL_COMMANDS: ResponsiveCommandMetadata[] = [
  { id: 'h1', priority: 1, estimatedWidth: 40, preferredSurface: 'toolbar' },
  { id: 'h2', priority: 2, estimatedWidth: 40, preferredSurface: 'toolbar' },
  { id: 'h3', priority: 3, estimatedWidth: 40, preferredSurface: 'toolbar' },
  { id: 'bullet-list', priority: 2, estimatedWidth: 40, preferredSurface: 'toolbar' },
  { id: 'ordered-list', priority: 3, estimatedWidth: 40, preferredSurface: 'toolbar' },
  { id: 'table', priority: 2, estimatedWidth: 40, preferredSurface: 'toolbar' },
  { id: 'quote', priority: 4, estimatedWidth: 40, preferredSurface: 'toolbar' },
  { id: 'code', priority: 4, estimatedWidth: 40, preferredSurface: 'toolbar' }
];

export interface AuroraToolbarProps {
  className?: string;
  style?: CSSProperties;
}

export function AuroraToolbar({ className = '', style }: AuroraToolbarProps) {
  const { editor, setElementPickerOpen, setCommandPaletteOpen } = useAurora();
  const containerRef = useRef<HTMLDivElement>(null);
  const [breakpoint, setBreakpoint] = useState<ResponsiveBreakpoint>('standard');
  const [visibleCommands, setVisibleCommands] = useState<string[]>([]);
  const [overflowCommands, setOverflowCommands] = useState<string[]>([]);
  const [isOverflowOpen, setIsOverflowOpen] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return undefined;

    const update = (width: number) => {
      const plan = calculateToolbarLayout(width, ALL_COMMANDS);
      setBreakpoint(plan.breakpoint);
      setVisibleCommands(plan.visibleCommandIds);
      setOverflowCommands(plan.overflowCommandIds);
    };

    update(containerRef.current.clientWidth || 1000);

    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver((entries) => {
        for (const entry of entries) {
          update(entry.contentRect.width);
        }
      });
      observer.observe(containerRef.current);
      return () => observer.disconnect();
    }
    return undefined;
  }, []);

  const exec = (cmd: string, input?: unknown) => {
    editor?.execute(cmd, input);
  };

  const isCommandVisible = (id: string) => visibleCommands.includes(id);

  return (
    <div
      ref={containerRef}
      className={`aurora-react-toolbar-wrapper aurora-bp-${breakpoint} ${className}`.trim()}
      style={style}
    >
      <div className="aurora-react-toolbar" role="toolbar" aria-label="React Editor Formatting Toolbar">
        <button type="button" className="aurora-tb-btn" onClick={() => exec('undo')} title="Undo (Ctrl+Z)">↩</button>
        <button type="button" className="aurora-tb-btn" onClick={() => exec('redo')} title="Redo (Ctrl+Y)">↪</button>
        <div className="aurora-tb-sep" />

        <button type="button" className="aurora-tb-btn" onClick={() => exec('toggleBold')} title="Bold (Ctrl+B)"><b>B</b></button>
        <button type="button" className="aurora-tb-btn" onClick={() => exec('toggleItalic')} title="Italic (Ctrl+I)"><i>I</i></button>
        <button type="button" className="aurora-tb-btn" onClick={() => exec('toggleUnderline')} title="Underline (Ctrl+U)"><u>U</u></button>
        <button type="button" className="aurora-tb-btn" onClick={() => exec('toggleStrike')} title="Strikethrough"><s>S</s></button>
        <div className="aurora-tb-sep" />

        {isCommandVisible('h1') && (
          <button type="button" className="aurora-tb-btn" onClick={() => exec('setHeading', { level: 1 })}>H1</button>
        )}
        {isCommandVisible('h2') && (
          <button type="button" className="aurora-tb-btn" onClick={() => exec('setHeading', { level: 2 })}>H2</button>
        )}
        {isCommandVisible('h3') && (
          <button type="button" className="aurora-tb-btn" onClick={() => exec('setHeading', { level: 3 })}>H3</button>
        )}

        {isCommandVisible('bullet-list') && (
          <button type="button" className="aurora-tb-btn" onClick={() => exec('toggleBulletList')} title="Bullet List">•≡</button>
        )}
        {isCommandVisible('ordered-list') && (
          <button type="button" className="aurora-tb-btn" onClick={() => exec('toggleOrderedList')} title="Numbered List">1≡</button>
        )}

        {isCommandVisible('table') && (
          <button type="button" className="aurora-tb-btn" onClick={() => exec('insertTable', { rows: 3, columns: 3 })} title="Insert Table">▦</button>
        )}
        {isCommandVisible('quote') && (
          <button type="button" className="aurora-tb-btn" onClick={() => exec('toggleBlockquote')} title="Quote">❝</button>
        )}
        {isCommandVisible('code') && (
          <button type="button" className="aurora-tb-btn" onClick={() => exec('toggleCodeBlock')} title="Code Block">&lt;/&gt;</button>
        )}

        <div className="aurora-tb-sep" />

        <button
          type="button"
          className="aurora-tb-btn aurora-tb-picker-btn"
          onClick={() => setElementPickerOpen(true)}
          title="All HTML Elements Picker"
        >
          🧩 Elements...
        </button>

        <button
          type="button"
          className="aurora-tb-btn"
          onClick={() => setCommandPaletteOpen(true)}
          title="Command Palette (Ctrl+K)"
        >
          ⌘K
        </button>

        {overflowCommands.length > 0 && (
          <div className="aurora-tb-overflow-container" style={{ position: 'relative', marginLeft: 'auto' }}>
            <button
              type="button"
              className="aurora-tb-btn aurora-tb-overflow-btn"
              onClick={() => setIsOverflowOpen(!isOverflowOpen)}
            >
              •••
            </button>
            {isOverflowOpen && (
              <div className="aurora-tb-overflow-dropdown" style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                background: 'white',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                zIndex: 1000,
                minWidth: '160px',
                padding: '4px 0'
              }}>
                {overflowCommands.map((cmdId) => (
                  <button
                    key={cmdId}
                    type="button"
                    className="aurora-dropdown-item"
                    style={{
                      display: 'block',
                      width: '100%',
                      padding: '8px 12px',
                      border: 'none',
                      background: 'transparent',
                      textAlign: 'left',
                      cursor: 'pointer'
                    }}
                    onClick={() => {
                      setIsOverflowOpen(false);
                      exec(cmdId);
                    }}
                  >
                    {cmdId}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
