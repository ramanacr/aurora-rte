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

const REACT_TOOLBAR_STYLES = `
  .aurora-react-toolbar-wrapper {
    display: flex;
    width: 100%;
    margin-bottom: 10px;
  }
  .aurora-react-toolbar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px;
    padding: 6px 10px;
    width: 100%;
    background: var(--aurora-muted-bg, rgba(255, 255, 255, 0.04));
    border: 1px solid var(--aurora-border, #132a59);
    border-radius: 8px;
    box-sizing: border-box;
  }
  .aurora-tb-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 32px;
    height: 32px;
    padding: 0 8px;
    border: 1px solid transparent;
    border-radius: 5px;
    background: transparent;
    color: var(--aurora-fg, #f0f4f8);
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s ease;
    user-select: none;
    box-sizing: border-box;
  }
  .aurora-tb-btn:hover {
    background: rgba(40, 230, 245, 0.12);
    border-color: var(--aurora-border, rgba(40, 230, 245, 0.3));
    color: var(--aurora-primary, #28E6F5);
  }
  .aurora-tb-btn:active {
    transform: scale(0.96);
  }
  .aurora-tb-btn.is-active {
    background: var(--aurora-primary, #28E6F5);
    color: #040d21;
    border-color: var(--aurora-primary, #28E6F5);
  }
  .aurora-tb-sep {
    width: 1px;
    height: 20px;
    background: var(--aurora-border, #132a59);
    margin: 0 4px;
  }
  .aurora-tb-picker-btn {
    color: var(--aurora-primary, #28E6F5);
    border-color: var(--aurora-border, #132a59);
    background: rgba(40, 230, 245, 0.08);
  }
`;

function ensureReactToolbarStyles() {
  if (typeof document === 'undefined') return;
  if (document.getElementById('aurora-react-toolbar-styles')) return;

  const styleEl = document.createElement('style');
  styleEl.id = 'aurora-react-toolbar-styles';
  styleEl.textContent = REACT_TOOLBAR_STYLES;
  document.head.appendChild(styleEl);
}

export interface AuroraToolbarProps {
  className?: string;
  style?: CSSProperties;
}

export function AuroraToolbar({ className = '', style }: AuroraToolbarProps) {
  ensureReactToolbarStyles();
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
