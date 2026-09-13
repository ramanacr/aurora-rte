import { createEditor } from '@aurora/editor';
import { createToolbar, createBubbleMenu, createSlashMenu, applyTheme, AURORA_BRAND_THEME, LIGHT_THEME, HIGH_CONTRAST_THEME } from '@aurora/ui';
import { calculateCounts, defaultSlashCommands } from '@aurora/features';
import type { AuroraDocument } from '@aurora/model';

const initialDoc: AuroraDocument = {
  format: 'aurora',
  version: 1,
  content: [
    {
      type: 'heading',
      attrs: { level: 1 },
      content: [{ type: 'text', text: 'Compose Without Limits' }]
    },
    {
      type: 'paragraph',
      content: [
        { type: 'text', text: 'Welcome to ' },
        { type: 'text', text: 'Aurora Editor', marks: [{ type: 'bold' }] },
        { type: 'text', text: ' — a fast, modern, white-labelable rich-text platform.' }
      ]
    },
    {
      type: 'blockquote',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Built to belong in any business SaaS product.' }]
        }
      ]
    }
  ]
};

export function initPlayground(rootElement: HTMLElement = document.body) {
  applyTheme(rootElement, AURORA_BRAND_THEME);

  const container = document.createElement('div');
  container.className = 'aurora-playground-layout';
  container.style.cssText = 'max-width: 960px; margin: 40px auto; font-family: var(--aurora-font-family); background: var(--aurora-bg); color: var(--aurora-fg); padding: 24px; border-radius: 8px; border: 1px solid var(--aurora-border);';

  // Header and theme selector
  const header = document.createElement('header');
  header.style.cssText = 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;';
  header.innerHTML = `
    <div>
      <h2 style="margin: 0; color: var(--aurora-primary);">Aurora Editor Playground</h2>
      <p style="margin: 4px 0 0 0; font-size: 0.9rem; color: var(--aurora-muted-fg);">Fast by design · Accessible · White-labelable</p>
    </div>
    <div style="display: flex; gap: 8px;">
      <button id="theme-brand" style="padding: 6px 12px; cursor: pointer; border-radius: 4px; border: 1px solid var(--aurora-border); background: var(--aurora-muted-bg); color: inherit;">Aurora Brand</button>
      <button id="theme-light" style="padding: 6px 12px; cursor: pointer; border-radius: 4px; border: 1px solid var(--aurora-border); background: var(--aurora-muted-bg); color: inherit;">Light</button>
      <button id="theme-contrast" style="padding: 6px 12px; cursor: pointer; border-radius: 4px; border: 1px solid var(--aurora-border); background: var(--aurora-muted-bg); color: inherit;">High Contrast</button>
    </div>
  `;
  container.appendChild(header);

  // Toolbar mount point
  const toolbarContainer = document.createElement('div');
  toolbarContainer.style.cssText = 'margin-bottom: 12px;';
  container.appendChild(toolbarContainer);

  // Editor mount point
  const editorMount = document.createElement('div');
  editorMount.style.cssText = 'min-height: 250px; padding: 16px; border: 1px solid var(--aurora-border); border-radius: 6px; background: rgba(255,255,255,0.02); outline: none;';
  container.appendChild(editorMount);

  // Stats bar
  const statsBar = document.createElement('footer');
  statsBar.style.cssText = 'display: flex; justify-content: space-between; margin-top: 12px; font-size: 0.85rem; color: var(--aurora-muted-fg);';
  statsBar.id = 'editor-stats';
  container.appendChild(statsBar);

  rootElement.appendChild(container);

  // Create Editor instance
  const editor = createEditor({
    element: editorMount,
    document: initialDoc
  });

  createToolbar({ editor, container: toolbarContainer });
  createBubbleMenu({ editor, container: rootElement });
  createSlashMenu({ editor, container: rootElement, commands: defaultSlashCommands() });

  function updateStats() {
    const counts = calculateCounts(editor.getDocument());
    statsBar.textContent = `Words: ${counts.words} | Characters: ${counts.characters} | Paragraphs: ${counts.paragraphs}`;
  }

  editor.on('change', updateStats);
  updateStats();

  // Theme switch listeners
  header.querySelector('#theme-brand')?.addEventListener('click', () => applyTheme(rootElement, AURORA_BRAND_THEME));
  header.querySelector('#theme-light')?.addEventListener('click', () => applyTheme(rootElement, LIGHT_THEME));
  header.querySelector('#theme-contrast')?.addEventListener('click', () => applyTheme(rootElement, HIGH_CONTRAST_THEME));

  return editor;
}

if (typeof window !== 'undefined' && document.getElementById('app')) {
  initPlayground(document.getElementById('app')!);
}
