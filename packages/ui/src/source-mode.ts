import { sanitizeHtml, migrateLegacyHtml } from './html-authoring/security-policy.js';

export interface SourceModeOptions {
  theme?: 'brand' | 'light' | 'contrast';
  debounceMs?: number;
  readOnly?: boolean;
  onHtmlChange?: (cleanHtml: string) => void;
}

export interface SourceModeController {
  element: HTMLElement;
  getHtml: () => string;
  setHtml: (html: string) => void;
  format: () => void;
  toggleVisible: (visible?: boolean) => boolean;
  isVisible: () => boolean;
  destroy: () => void;
}

/**
 * Cleanly formats HTML string with 2-space indentation.
 */
export function formatRawHtml(html: string): string {
  if (!html || typeof html !== 'string') return '';

  const singleTags = new Set([
    'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
    'link', 'meta', 'param', 'source', 'track', 'wbr'
  ]);

  const tokens = html
    .replace(/(<[^>]+>)/g, '\n$1\n')
    .split('\n')
    .map((t) => t.trim())
    .filter((t) => t.length > 0);

  let formatted = '';
  let indentLevel = 0;
  const indentStr = '  ';

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];

    if (token.startsWith('</')) {
      indentLevel = Math.max(0, indentLevel - 1);
      formatted += `${indentStr.repeat(indentLevel)}${token}\n`;
    } else if (token.startsWith('<') && !token.startsWith('<!')) {
      const match = /^<([a-zA-Z0-9_-]+)/.exec(token);
      const tag = match ? match[1].toLowerCase() : '';
      const isSelfClosing = token.endsWith('/>') || singleTags.has(tag);

      formatted += `${indentStr.repeat(indentLevel)}${token}\n`;
      if (!isSelfClosing && !token.includes(`</${tag}>`)) {
        indentLevel++;
      }
    } else {
      formatted += `${indentStr.repeat(indentLevel)}${token}\n`;
    }
  }

  return formatted.trim();
}

/**
 * Creates an interactive bi-directional raw HTML source editor view.
 */
export function createSourceModeView(
  initialHtml: string,
  options: SourceModeOptions = {}
): SourceModeController {
  const debounceMs = options.debounceMs ?? 350;
  let isTypingInSource = false;
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  let visible = true;

  const container = document.createElement('div');
  container.className = 'aurora-source-mode-container';
  container.style.cssText = `
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    min-height: 280px;
    background: #020814;
    color: #00F0FF;
    border: 1px solid #132a59;
    border-radius: 8px;
    overflow: hidden;
    font-family: 'JetBrains Mono', 'Fira Code', Consolas, Monaco, monospace;
    box-shadow: inset 0 2px 8px rgba(0,0,0,0.5);
  `;

  // Source Mode Header
  const header = document.createElement('div');
  header.className = 'aurora-source-mode-header';
  header.style.cssText = `
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 14px;
    background: #061530;
    border-bottom: 1px solid #132a59;
    font-size: 0.82rem;
  `;
  header.innerHTML = `
    <div style="display: flex; align-items: center; gap: 8px;">
      <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: #28E6F5; box-shadow: 0 0 6px #28E6F5;"></span>
      <span style="font-weight: 700; color: #f0f4f8; letter-spacing: 0.05em;">&lt;/&gt; SOURCE HTML MODE</span>
      <span id="source-sync-badge" style="font-size: 0.72rem; padding: 2px 6px; border-radius: 4px; background: rgba(37,224,196,0.15); color: #25E0C4; border: 1px solid rgba(37,224,196,0.3);">Synced</span>
    </div>
    <div style="display: flex; gap: 6px;">
      <button id="source-format-btn" style="padding: 4px 10px; font-size: 0.75rem; font-weight: 600; cursor: pointer; border-radius: 4px; border: 1px solid #1f3b73; background: #0c234b; color: #28E6F5;">Format HTML</button>
      <button id="source-copy-btn" style="padding: 4px 10px; font-size: 0.75rem; font-weight: 600; cursor: pointer; border-radius: 4px; border: 1px solid #1f3b73; background: #0c234b; color: #f0f4f8;">Copy</button>
    </div>
  `;
  container.appendChild(header);

  // Editor Area (Line numbers + Textarea)
  const body = document.createElement('div');
  body.className = 'aurora-source-mode-body';
  body.style.cssText = `
    display: flex;
    flex: 1;
    position: relative;
    overflow: hidden;
    height: calc(100% - 40px);
    min-height: 240px;
  `;

  const lineNumbers = document.createElement('div');
  lineNumbers.className = 'aurora-source-line-numbers';
  lineNumbers.style.cssText = `
    width: 44px;
    padding: 12px 6px;
    text-align: right;
    user-select: none;
    color: #435b88;
    background: #030d20;
    border-right: 1px solid #132a59;
    font-size: 0.82rem;
    line-height: 1.5;
    overflow: hidden;
  `;

  const textarea = document.createElement('textarea');
  textarea.className = 'aurora-source-textarea';
  textarea.spellcheck = false;
  textarea.style.cssText = `
    flex: 1;
    padding: 12px;
    margin: 0;
    border: none;
    outline: none;
    background: transparent;
    color: #e2ecf9;
    font-family: inherit;
    font-size: 0.82rem;
    line-height: 1.5;
    resize: none;
    white-space: pre;
    overflow: auto;
    tab-size: 2;
  `;

  body.appendChild(lineNumbers);
  body.appendChild(textarea);
  container.appendChild(body);

  function updateLineNumbers() {
    const lines = textarea.value.split('\n').length;
    lineNumbers.innerHTML = Array.from({ length: lines }, (_, i) => i + 1).join('<br>');
  }

  // Sync scroll
  textarea.addEventListener('scroll', () => {
    lineNumbers.scrollTop = textarea.scrollTop;
  });

  const syncBadge = header.querySelector('#source-sync-badge') as HTMLElement;

  function handleSourceInput() {
    isTypingInSource = true;
    updateLineNumbers();
    if (syncBadge) {
      syncBadge.textContent = 'Syncing...';
      syncBadge.style.color = '#FFAA00';
      syncBadge.style.borderColor = 'rgba(255,170,0,0.4)';
    }

    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      isTypingInSource = false;
      const raw = textarea.value;
      const migrated = migrateLegacyHtml(raw);
      const cleaned = sanitizeHtml(migrated);

      if (options.onHtmlChange) {
        options.onHtmlChange(cleaned);
      }

      if (syncBadge) {
        syncBadge.textContent = 'Synced';
        syncBadge.style.color = '#25E0C4';
        syncBadge.style.borderColor = 'rgba(37,224,196,0.3)';
      }
    }, debounceMs);
  }

  textarea.addEventListener('input', handleSourceInput);

  // Format button
  const formatBtn = header.querySelector('#source-format-btn') as HTMLElement;
  formatBtn?.addEventListener('click', () => {
    textarea.value = formatRawHtml(textarea.value);
    updateLineNumbers();
    handleSourceInput();
  });

  // Copy button
  const copyBtn = header.querySelector('#source-copy-btn') as HTMLElement;
  copyBtn?.addEventListener('click', () => {
    navigator.clipboard.writeText(textarea.value);
    const originalText = copyBtn.textContent;
    copyBtn.textContent = 'Copied!';
    setTimeout(() => {
      copyBtn.textContent = originalText;
    }, 1500);
  });

  // Set initial content
  textarea.value = formatRawHtml(initialHtml);
  updateLineNumbers();

  return {
    element: container,
    getHtml: () => textarea.value,
    setHtml: (html: string) => {
      if (isTypingInSource) return;
      textarea.value = formatRawHtml(html);
      updateLineNumbers();
    },
    format: () => {
      textarea.value = formatRawHtml(textarea.value);
      updateLineNumbers();
    },
    toggleVisible: (forceVisible?: boolean) => {
      visible = forceVisible !== undefined ? forceVisible : !visible;
      container.style.display = visible ? 'flex' : 'none';
      return visible;
    },
    isVisible: () => visible,
    destroy: () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      container.remove();
    }
  };
}
