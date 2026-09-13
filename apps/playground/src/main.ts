import { createEditor } from '@aurora/editor';
import {
  createToolbar,
  createBubbleMenu,
  createSlashMenu,
  applyTheme,
  AURORA_BRAND_THEME,
  LIGHT_THEME,
  HIGH_CONTRAST_THEME
} from '@aurora/ui';
import { calculateCounts, defaultSlashCommands, cleanPastedHtml } from '@aurora/features';
import type { AuroraDocument, JsonPatch } from '@aurora/model';
import { insertSampleCallout } from './examples/custom-block.js';

const initialDoc: AuroraDocument = {
  format: 'aurora',
  version: 1,
  content: [
    {
      type: 'heading',
      attrs: { level: 1 },
      content: [{ type: 'text', text: 'Aurora Real-Time Collaborative Workspace' }]
    },
    {
      type: 'paragraph',
      content: [
        { type: 'text', text: 'Welcome to ' },
        { type: 'text', text: 'Aurora Editor', marks: [{ type: 'bold' }] },
        {
          type: 'text',
          text: ' — an enterprise-ready, white-labelable rich-text platform with zero vendor lock-in.'
        }
      ]
    },
    {
      type: 'blockquote',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'Multi-client real-time synchronization, versioned JSON documents, and governed review workflows.'
            }
          ]
        }
      ]
    },
    {
      type: 'paragraph',
      content: [
        {
          type: 'text',
          text: 'Test live typing, concurrent edits, formatting, tables, and patch streams below.'
        }
      ]
    }
  ]
};

interface CollabMessage {
  type: 'doc_change' | 'presence' | 'cursor';
  senderId: string;
  senderName: string;
  document?: AuroraDocument;
  patches?: readonly JsonPatch[];
  transactionId?: string;
  timestamp: number;
}

export function initPlayground(rootElement: HTMLElement = document.body) {
  applyTheme(rootElement, AURORA_BRAND_THEME);

  // Cross-tab broadcast channel for local multi-tab testing
  const broadcastChannel = typeof BroadcastChannel !== 'undefined'
    ? new BroadcastChannel('aurora_collab_bus')
    : null;

  // Real-time WebSocket connection
  let ws: WebSocket | null = null;
  const myClientId = 'client_' + Math.random().toString(36).slice(2, 7);

  function connectWs() {
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        updateNetworkBadge(true);
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          handleIncomingSync(msg, 'websocket');
        } catch {
          // ignore parsing error
        }
      };

      ws.onclose = () => {
        updateNetworkBadge(false);
        setTimeout(connectWs, 3000);
      };

      ws.onerror = () => {
        updateNetworkBadge(false);
      };
    } catch {
      updateNetworkBadge(false);
    }
  }

  // Layout container
  const container = document.createElement('div');
  container.className = 'aurora-playground-container';
  container.style.cssText = `
    max-width: 1280px;
    margin: 20px auto;
    font-family: var(--aurora-font-family, system-ui, sans-serif);
    background: var(--aurora-bg, #040d21);
    color: var(--aurora-fg, #f0f4f8);
    padding: 24px;
    border-radius: 12px;
    border: 1px solid var(--aurora-border, #132a59);
    box-shadow: 0 10px 40px rgba(0,0,0,0.5);
  `;

  // Header
  const header = document.createElement('header');
  header.style.cssText = `
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid var(--aurora-border, #132a59);
    padding-bottom: 16px;
    margin-bottom: 20px;
    flex-wrap: wrap;
    gap: 12px;
  `;
  header.innerHTML = `
    <div style="display: flex; align-items: center; gap: 14px;">
      <img src="/favicon-64.png" alt="Aurora Logo" style="width: 42px; height: 42px; filter: drop-shadow(0 0 8px rgba(40,230,245,0.4));" />
      <div>
        <h1 style="margin: 0; font-size: 1.5rem; color: var(--aurora-primary, #28E6F5); letter-spacing: -0.02em;">
          Aurora Rich-Text Platform
        </h1>
        <p style="margin: 3px 0 0 0; font-size: 0.85rem; color: var(--aurora-muted-fg, #8ca0c2);">
          Client-Side Core · Governed Services · Real-Time Collaboration
        </p>
      </div>
    </div>
    <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
      <div id="net-badge" style="display: flex; align-items: center; gap: 6px; font-size: 0.8rem; background: rgba(37,224,196,0.1); color: #25E0C4; padding: 6px 12px; border-radius: 20px; border: 1px solid rgba(37,224,196,0.3);">
        <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: #25E0C4;"></span>
        <span>Local / Broadcast Ready</span>
      </div>
      <div style="display: flex; gap: 4px; background: rgba(255,255,255,0.05); padding: 4px; border-radius: 6px;">
        <button id="theme-brand" title="Aurora Brand Preset" style="padding: 6px 10px; font-size: 0.8rem; cursor: pointer; border-radius: 4px; border: none; background: var(--aurora-primary, #28E6F5); color: #040d21; font-weight: 600;">Brand</button>
        <button id="theme-light" title="Light Preset" style="padding: 6px 10px; font-size: 0.8rem; cursor: pointer; border-radius: 4px; border: none; background: transparent; color: inherit;">Light</button>
        <button id="theme-contrast" title="High Contrast Preset" style="padding: 6px 10px; font-size: 0.8rem; cursor: pointer; border-radius: 4px; border: none; background: transparent; color: inherit;">Contrast</button>
      </div>
    </div>
  `;
  container.appendChild(header);

  // Navigation Tabs
  const nav = document.createElement('div');
  nav.style.cssText = `
    display: flex;
    gap: 8px;
    border-bottom: 2px solid var(--aurora-border, #132a59);
    margin-bottom: 20px;
    padding-bottom: 2px;
  `;
  nav.innerHTML = `
    <button id="tab-collab" style="padding: 10px 18px; font-size: 0.95rem; font-weight: 600; cursor: pointer; border: none; border-bottom: 3px solid #28E6F5; background: rgba(40,230,245,0.08); color: #28E6F5; border-radius: 6px 6px 0 0;">
      👥 Live Collaborative Testing (Alice & Bob)
    </button>
    <button id="tab-single" style="padding: 10px 18px; font-size: 0.95rem; font-weight: 600; cursor: pointer; border: none; border-bottom: 3px solid transparent; background: transparent; color: var(--aurora-muted-fg, #8ca0c2); border-radius: 6px 6px 0 0;">
      🌟 Single Editor Showcase
    </button>
    <button id="tab-model" style="padding: 10px 18px; font-size: 0.95rem; font-weight: 600; cursor: pointer; border: none; border-bottom: 3px solid transparent; background: transparent; color: var(--aurora-muted-fg, #8ca0c2); border-radius: 6px 6px 0 0;">
      📦 Model & Exporter Inspector
    </button>
  `;
  container.appendChild(nav);

  // Content Panes
  const collabPane = document.createElement('div');
  collabPane.id = 'pane-collab';
  container.appendChild(collabPane);

  const singlePane = document.createElement('div');
  singlePane.id = 'pane-single';
  singlePane.style.display = 'none';
  container.appendChild(singlePane);

  const modelPane = document.createElement('div');
  modelPane.id = 'pane-model';
  modelPane.style.display = 'none';
  container.appendChild(modelPane);

  rootElement.appendChild(container);

  function updateNetworkBadge(connected: boolean) {
    const badge = header.querySelector('#net-badge') as HTMLElement;
    if (!badge) return;
    if (connected) {
      badge.innerHTML = `
        <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: #25E0C4; box-shadow: 0 0 8px #25E0C4;"></span>
        <span>WebSocket Live (${myClientId})</span>
      `;
      badge.style.background = 'rgba(37,224,196,0.15)';
      badge.style.color = '#25E0C4';
    } else {
      badge.innerHTML = `
        <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: #7549FF;"></span>
        <span>BroadcastChannel Sync (${myClientId})</span>
      `;
      badge.style.background = 'rgba(117,73,255,0.15)';
      badge.style.color = '#a685ff';
    }
  }

  // Tab switching logic
  const tabCollab = nav.querySelector('#tab-collab') as HTMLButtonElement;
  const tabSingle = nav.querySelector('#tab-single') as HTMLButtonElement;
  const tabModel = nav.querySelector('#tab-model') as HTMLButtonElement;

  function switchTab(activeTab: 'collab' | 'single' | 'model') {
    [tabCollab, tabSingle, tabModel].forEach((b) => {
      b.style.borderBottomColor = 'transparent';
      b.style.background = 'transparent';
      b.style.color = 'var(--aurora-muted-fg, #8ca0c2)';
    });

    collabPane.style.display = 'none';
    singlePane.style.display = 'none';
    modelPane.style.display = 'none';

    if (activeTab === 'collab') {
      tabCollab.style.borderBottomColor = '#28E6F5';
      tabCollab.style.background = 'rgba(40,230,245,0.08)';
      tabCollab.style.color = '#28E6F5';
      collabPane.style.display = 'block';
    } else if (activeTab === 'single') {
      tabSingle.style.borderBottomColor = '#28E6F5';
      tabSingle.style.background = 'rgba(40,230,245,0.08)';
      tabSingle.style.color = '#28E6F5';
      singlePane.style.display = 'block';
    } else {
      tabModel.style.borderBottomColor = '#28E6F5';
      tabModel.style.background = 'rgba(40,230,245,0.08)';
      tabModel.style.color = '#28E6F5';
      modelPane.style.display = 'block';
      refreshModelView();
    }
  }

  tabCollab.addEventListener('click', () => switchTab('collab'));
  tabSingle.addEventListener('click', () => switchTab('single'));
  tabModel.addEventListener('click', () => switchTab('model'));

  // -------------------------------------------------------------
  // 1. COLLABORATIVE EDITING PANE (Alice & Bob Split View)
  // -------------------------------------------------------------
  collabPane.innerHTML = `
    <div style="background: rgba(6,21,53,0.7); border: 1px solid var(--aurora-border, #132a59); border-radius: 8px; padding: 16px; margin-bottom: 20px;">
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
        <div>
          <h3 style="margin: 0; font-size: 1.15rem; color: #28E6F5;">👥 Real-Time Collaborative Synchronization Engine</h3>
          <p style="margin: 4px 0 0 0; font-size: 0.85rem; color: var(--aurora-muted-fg, #8ca0c2);">
            Changes typed in Alice immediately sync to Bob and vice versa. RFC 6902 JSON Patches are calculated, verified, and applied automatically.
          </p>
        </div>
        <div style="display: flex; gap: 8px; flex-wrap: wrap;">
          <button id="btn-collab-type-alice" style="padding: 6px 12px; font-size: 0.85rem; border-radius: 4px; border: 1px solid rgba(40,230,245,0.4); background: rgba(40,230,245,0.1); color: #28E6F5; cursor: pointer;">
            ⚡ Alice Types Paragraph
          </button>
          <button id="btn-collab-bold-bob" style="padding: 6px 12px; font-size: 0.85rem; border-radius: 4px; border: 1px solid rgba(37,224,196,0.4); background: rgba(37,224,196,0.1); color: #25E0C4; cursor: pointer;">
            ⚡ Bob Inserts Table
          </button>
          <button id="btn-collab-reset" style="padding: 6px 12px; font-size: 0.85rem; border-radius: 4px; border: 1px solid rgba(255,255,255,0.2); background: rgba(255,255,255,0.05); color: #fff; cursor: pointer;">
            🔄 Reset Doc
          </button>
        </div>
      </div>
    </div>

    <!-- Two-Column Split View -->
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
      <!-- ALICE PANEL -->
      <div style="background: rgba(4,13,33,0.9); border: 2px solid #28E6F5; border-radius: 8px; padding: 14px; display: flex; flex-direction: column;">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(40,230,245,0.3); padding-bottom: 8px; margin-bottom: 10px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="background: #28E6F5; color: #040d21; font-weight: 700; font-size: 0.75rem; padding: 3px 8px; border-radius: 12px;">CLIENT 1</span>
            <strong style="color: #28E6F5;">Alice (Lead Author)</strong>
          </div>
          <span id="alice-status" style="font-size: 0.8rem; color: var(--aurora-muted-fg, #8ca0c2);">Ready</span>
        </div>
        <div id="alice-toolbar" style="margin-bottom: 10px;"></div>
        <div id="alice-editor-mount" style="min-height: 220px; flex: 1; padding: 12px; border: 1px solid rgba(40,230,245,0.2); border-radius: 6px; background: rgba(255,255,255,0.015); outline: none;"></div>
        <div id="alice-stats" style="margin-top: 8px; font-size: 0.8rem; color: var(--aurora-muted-fg, #8ca0c2);">Words: 0 | Chars: 0</div>
      </div>

      <!-- BOB PANEL -->
      <div style="background: rgba(4,13,33,0.9); border: 2px solid #25E0C4; border-radius: 8px; padding: 14px; display: flex; flex-direction: column;">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(37,224,196,0.3); padding-bottom: 8px; margin-bottom: 10px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="background: #25E0C4; color: #040d21; font-weight: 700; font-size: 0.75rem; padding: 3px 8px; border-radius: 12px;">CLIENT 2</span>
            <strong style="color: #25E0C4;">Bob (Reviewer / Co-author)</strong>
          </div>
          <span id="bob-status" style="font-size: 0.8rem; color: var(--aurora-muted-fg, #8ca0c2);">Ready</span>
        </div>
        <div id="bob-toolbar" style="margin-bottom: 10px;"></div>
        <div id="bob-editor-mount" style="min-height: 220px; flex: 1; padding: 12px; border: 1px solid rgba(37,224,196,0.2); border-radius: 6px; background: rgba(255,255,255,0.015); outline: none;"></div>
        <div id="bob-stats" style="margin-top: 8px; font-size: 0.8rem; color: var(--aurora-muted-fg, #8ca0c2);">Words: 0 | Chars: 0</div>
      </div>
    </div>

    <!-- Live Patch & Transaction Log -->
    <div style="background: #020714; border: 1px solid var(--aurora-border, #132a59); border-radius: 8px; padding: 14px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
        <strong style="font-size: 0.9rem; color: #7549FF;">📡 Real-Time RFC 6902 JSON Patch & Event Stream</strong>
        <span id="patch-stats" style="font-size: 0.8rem; color: var(--aurora-muted-fg, #8ca0c2);">Patches exchanged: 0</span>
      </div>
      <div id="patch-log" style="height: 140px; overflow-y: auto; font-family: ui-monospace, monospace; font-size: 0.8rem; color: #d0dcf5; line-height: 1.5; padding: 8px; background: rgba(0,0,0,0.4); border-radius: 4px; border: 1px solid rgba(255,255,255,0.05);">
        <div style="color: #8ca0c2;">[System] Collaborative synchronization session initialized. Ready for keystrokes...</div>
      </div>
    </div>
  `;

  // Initialize Alice Editor
  const aliceMount = collabPane.querySelector('#alice-editor-mount') as HTMLElement;
  const aliceToolbar = collabPane.querySelector('#alice-toolbar') as HTMLElement;
  const aliceStats = collabPane.querySelector('#alice-stats') as HTMLElement;
  const aliceStatus = collabPane.querySelector('#alice-status') as HTMLElement;

  const editorAlice = createEditor({
    element: aliceMount,
    document: JSON.parse(JSON.stringify(initialDoc))
  });
  createToolbar({ editor: editorAlice, container: aliceToolbar });

  // Initialize Bob Editor
  const bobMount = collabPane.querySelector('#bob-editor-mount') as HTMLElement;
  const bobToolbar = collabPane.querySelector('#bob-toolbar') as HTMLElement;
  const bobStats = collabPane.querySelector('#bob-stats') as HTMLElement;
  const bobStatus = collabPane.querySelector('#bob-status') as HTMLElement;

  const editorBob = createEditor({
    element: bobMount,
    document: JSON.parse(JSON.stringify(initialDoc))
  });
  createToolbar({ editor: editorBob, container: bobToolbar });

  // -------------------------------------------------------------
  // 2. SINGLE EDITOR SHOWCASE PANE
  // -------------------------------------------------------------
  singlePane.innerHTML = `
    <div style="margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
      <div>
        <h3 style="margin: 0; color: #28E6F5;">🌟 Complete Aurora RTE Feature Showcase</h3>
        <p style="margin: 2px 0 0 0; font-size: 0.85rem; color: var(--aurora-muted-fg, #8ca0c2);">Full formatting, slash commands (/), bubble menu, tables, custom callouts, and clean Word paste normalization.</p>
      </div>
      <div style="display: flex; gap: 8px; flex-wrap: wrap;">
        <button id="btn-insert-callout" style="padding: 6px 12px; font-size: 0.85rem; border-radius: 4px; border: 1px solid rgba(40,230,245,0.4); background: rgba(40,230,245,0.1); color: #28E6F5; cursor: pointer;">
          + Custom Callout Block
        </button>
        <button id="btn-insert-table" style="padding: 6px 12px; font-size: 0.85rem; border-radius: 4px; border: 1px solid rgba(37,224,196,0.4); background: rgba(37,224,196,0.1); color: #25E0C4; cursor: pointer;">
          + Insert Table (3x3)
        </button>
        <button id="btn-paste-word" style="padding: 6px 12px; font-size: 0.85rem; border-radius: 4px; border: 1px solid rgba(117,73,255,0.4); background: rgba(117,73,255,0.1); color: #a685ff; cursor: pointer;">
          📋 Test Word Paste Sanitizer
        </button>
      </div>
    </div>
    <div id="single-toolbar" style="margin-bottom: 12px;"></div>
    <div id="single-editor-mount" style="min-height: 350px; padding: 20px; border: 1px solid var(--aurora-border, #132a59); border-radius: 8px; background: rgba(255,255,255,0.02); outline: none;"></div>
    <div id="single-stats" style="margin-top: 10px; font-size: 0.85rem; color: var(--aurora-muted-fg, #8ca0c2);"></div>
  `;

  const singleMount = singlePane.querySelector('#single-editor-mount') as HTMLElement;
  const singleToolbar = singlePane.querySelector('#single-toolbar') as HTMLElement;
  const singleStats = singlePane.querySelector('#single-stats') as HTMLElement;

  const editorSingle = createEditor({
    element: singleMount,
    document: JSON.parse(JSON.stringify(initialDoc))
  });
  createToolbar({ editor: editorSingle, container: singleToolbar });
  createBubbleMenu({ editor: editorSingle, container: rootElement });
  createSlashMenu({ editor: editorSingle, container: rootElement, commands: defaultSlashCommands() });

  singlePane.querySelector('#btn-insert-callout')?.addEventListener('click', () => {
    insertSampleCallout(editorSingle);
  });

  singlePane.querySelector('#btn-insert-table')?.addEventListener('click', () => {
    editorSingle.execute('insertTable', { rows: 3, columns: 3, header: true });
  });

  singlePane.querySelector('#btn-paste-word')?.addEventListener('click', () => {
    const sampleWordMarkup = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word">
        <body>
          <!--[if gte mso 9]><xml><w:WordDocument><w:View>Normal</w:View></w:WordDocument></xml><![endif]-->
          <p class="MsoNormal"><b style="mso-bidi-font-weight:normal">Cleaned from Word:</b> This text came from Microsoft Word.</p>
          <p class="MsoListParagraph" style="text-indent:-.25in;mso-list:l0 level1 lfo1">
            <span style="mso-list:Ignore">·<span style="font:7.0pt 'Times New Roman'">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span></span>
            Item One with stripped Mso tags
          </p>
          <p class="MsoListParagraph" style="text-indent:-.25in;mso-list:l0 level1 lfo1">
            <span style="mso-list:Ignore">·<span style="font:7.0pt 'Times New Roman'">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span></span>
            Item Two with stripped Mso tags
          </p>
        </body>
      </html>
    `;
    const cleaned = cleanPastedHtml(sampleWordMarkup);
    editorSingle.execute('insertText', { text: '\\n' + cleaned.replace(/<[^>]+>/g, ' ').replace(/\\s+/g, ' ').trim() + '\\n' });
    appendPatchLog('System', 'Pasted & sanitized Word markup successfully.');
  });

  // -------------------------------------------------------------
  // 3. MODEL & EXPORTER INSPECTOR PANE
  // -------------------------------------------------------------
  modelPane.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
      <div>
        <h3 style="margin: 0; color: #28E6F5;">📦 Canonical Aurora Document AST & Format Exporter</h3>
        <p style="margin: 2px 0 0 0; font-size: 0.85rem; color: var(--aurora-muted-fg, #8ca0c2);">Deterministic serialization, strict schema bounds, and loss-free export to CommonMark & safe HTML.</p>
      </div>
      <div style="display: flex; gap: 8px;">
        <button id="btn-export-json" style="padding: 6px 12px; font-size: 0.85rem; border-radius: 4px; border: 1px solid rgba(40,230,245,0.4); background: rgba(40,230,245,0.1); color: #28E6F5; cursor: pointer;">JSON</button>
        <button id="btn-export-html" style="padding: 6px 12px; font-size: 0.85rem; border-radius: 4px; border: 1px solid rgba(37,224,196,0.4); background: rgba(37,224,196,0.1); color: #25E0C4; cursor: pointer;">HTML</button>
        <button id="btn-export-md" style="padding: 6px 12px; font-size: 0.85rem; border-radius: 4px; border: 1px solid rgba(117,73,255,0.4); background: rgba(117,73,255,0.1); color: #a685ff; cursor: pointer;">Markdown</button>
      </div>
    </div>
    <pre id="model-output" style="background: #020714; border: 1px solid var(--aurora-border, #132a59); border-radius: 8px; padding: 16px; font-family: ui-monospace, monospace; font-size: 0.85rem; color: #72ffb2; max-height: 480px; overflow: auto; line-height: 1.4;"></pre>
  `;

  let currentExportFormat: 'json' | 'html' | 'markdown' = 'json';

  function refreshModelView() {
    const pre = modelPane.querySelector('#model-output') as HTMLPreElement;
    if (!pre) return;
    const doc = editorSingle.getDocument();
    if (currentExportFormat === 'json') {
      pre.textContent = JSON.stringify(doc, null, 2);
    } else if (currentExportFormat === 'html') {
      pre.textContent = editorSingle.export({ format: 'html' });
    } else {
      pre.textContent = editorSingle.export({ format: 'markdown' });
    }
  }

  modelPane.querySelector('#btn-export-json')?.addEventListener('click', () => {
    currentExportFormat = 'json';
    refreshModelView();
  });
  modelPane.querySelector('#btn-export-html')?.addEventListener('click', () => {
    currentExportFormat = 'html';
    refreshModelView();
  });
  modelPane.querySelector('#btn-export-md')?.addEventListener('click', () => {
    currentExportFormat = 'markdown';
    refreshModelView();
  });

  // -------------------------------------------------------------
  // COLLABORATION REAL-TIME SYNCHRONIZATION ENGINE
  // -------------------------------------------------------------
  let isSyncing = false;
  let patchCounter = 0;
  const patchLog = collabPane.querySelector('#patch-log') as HTMLElement;
  const patchStats = collabPane.querySelector('#patch-stats') as HTMLElement;

  function appendPatchLog(sender: string, message: string, color: string = '#28E6F5') {
    if (!patchLog) return;
    patchCounter++;
    patchStats.textContent = `Patches exchanged: ${patchCounter}`;

    const line = document.createElement('div');
    line.style.cssText = 'margin-bottom: 3px; word-break: break-all;';
    const time = new Date().toLocaleTimeString();
    line.innerHTML = `<span style="color: #61759b;">[${time}]</span> <span style="color: ${color}; font-weight: 600;">${sender}:</span> ${message}`;
    patchLog.appendChild(line);
    patchLog.scrollTop = patchLog.scrollHeight;
  }

  function broadcastChange(senderId: string, senderName: string, doc: AuroraDocument, patches: readonly JsonPatch[], txId: string) {
    const msg: CollabMessage = {
      type: 'doc_change',
      senderId,
      senderName,
      document: doc,
      patches,
      transactionId: txId,
      timestamp: Date.now()
    };

    // Broadcast across browser tabs
    if (broadcastChannel) {
      try {
        broadcastChannel.postMessage(msg);
      } catch {}
    }

    // Broadcast through WebSocket to server and other clients
    if (ws && ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(JSON.stringify(msg));
      } catch {}
    }
  }

  function handleIncomingSync(msg: CollabMessage, source: 'broadcast' | 'websocket' | 'local') {
    if (isSyncing) return;
    if (msg.type !== 'doc_change' || !msg.document) return;

    isSyncing = true;
    try {
      const patchSummary = msg.patches && msg.patches.length > 0
        ? msg.patches.map(p => `${p.op} ${p.path}`).join(', ')
        : 'full snapshot sync';

      const color = msg.senderId.includes('alice') ? '#28E6F5' : '#25E0C4';
      appendPatchLog(msg.senderName, `Transaction ${msg.transactionId?.slice(-6) || 'sync'} applied [${patchSummary}] via ${source}`, color);

      // If sent by Alice, update Bob
      if (msg.senderId === 'alice') {
        editorBob.setDocument(msg.document);
        editorSingle.setDocument(msg.document);
        bobStatus.textContent = `Synced with Alice (${new Date().toLocaleTimeString()})`;
      }
      // If sent by Bob, update Alice
      else if (msg.senderId === 'bob') {
        editorAlice.setDocument(msg.document);
        editorSingle.setDocument(msg.document);
        aliceStatus.textContent = `Synced with Bob (${new Date().toLocaleTimeString()})`;
      }
      // If received from external client/tab
      else if (msg.senderId !== myClientId) {
        editorAlice.setDocument(msg.document);
        editorBob.setDocument(msg.document);
        editorSingle.setDocument(msg.document);
        aliceStatus.textContent = `Synced with ${msg.senderName}`;
        bobStatus.textContent = `Synced with ${msg.senderName}`;
      }
    } finally {
      isSyncing = false;
      updateCounts();
    }
  }

  if (broadcastChannel) {
    broadcastChannel.onmessage = (event) => {
      handleIncomingSync(event.data, 'broadcast');
    };
  }

  // Alice Change Listener
  editorAlice.on('change', ({ document, patches, origin, transactionId }) => {
    if (isSyncing) return;
    if (origin === 'user' || origin === 'command') {
      aliceStatus.textContent = 'Editing...';
      bobStatus.textContent = 'Receiving Alice update...';

      // Sync to Bob
      isSyncing = true;
      try {
        editorBob.setDocument(document);
        editorSingle.setDocument(document);
      } finally {
        isSyncing = false;
      }

      appendPatchLog('Alice (Client 1)', `Generated ${patches.length} patch(es): ${patches.map(p => `${p.op} ${p.path}`).join(', ')}`, '#28E6F5');
      broadcastChange('alice', 'Alice', document, patches, transactionId);

      setTimeout(() => {
        aliceStatus.textContent = 'Synced';
        bobStatus.textContent = 'Synced with Alice';
      }, 300);
    }
    updateCounts();
  });

  // Bob Change Listener
  editorBob.on('change', ({ document, patches, origin, transactionId }) => {
    if (isSyncing) return;
    if (origin === 'user' || origin === 'command') {
      bobStatus.textContent = 'Editing...';
      aliceStatus.textContent = 'Receiving Bob update...';

      // Sync to Alice
      isSyncing = true;
      try {
        editorAlice.setDocument(document);
        editorSingle.setDocument(document);
      } finally {
        isSyncing = false;
      }

      appendPatchLog('Bob (Client 2)', `Generated ${patches.length} patch(es): ${patches.map(p => `${p.op} ${p.path}`).join(', ')}`, '#25E0C4');
      broadcastChange('bob', 'Bob', document, patches, transactionId);

      setTimeout(() => {
        bobStatus.textContent = 'Synced';
        aliceStatus.textContent = 'Synced with Bob';
      }, 300);
    }
    updateCounts();
  });

  // Single Editor Change Listener
  editorSingle.on('change', ({ document, patches, origin, transactionId }) => {
    if (isSyncing) return;
    if (origin === 'user' || origin === 'command') {
      isSyncing = true;
      try {
        editorAlice.setDocument(document);
        editorBob.setDocument(document);
      } finally {
        isSyncing = false;
      }
      broadcastChange(myClientId, 'Showcase User', document, patches, transactionId);
    }
    updateCounts();
  });

  // Quick action buttons
  collabPane.querySelector('#btn-collab-type-alice')?.addEventListener('click', () => {
    editorAlice.execute('insertText', { text: ' [Alice added this live collaborative note at ' + new Date().toLocaleTimeString() + '] ' });
  });

  collabPane.querySelector('#btn-collab-bold-bob')?.addEventListener('click', () => {
    editorBob.execute('insertTable', { rows: 2, columns: 3, header: true });
  });

  collabPane.querySelector('#btn-collab-reset')?.addEventListener('click', () => {
    isSyncing = true;
    try {
      editorAlice.setDocument(initialDoc);
      editorBob.setDocument(initialDoc);
      editorSingle.setDocument(initialDoc);
    } finally {
      isSyncing = false;
    }
    appendPatchLog('System', 'Document state reset to default template.', '#ff6b6b');
    broadcastChange('system', 'System', initialDoc, [{ op: 'replace', path: '', value: initialDoc }], 'tx_reset');
    updateCounts();
  });

  function updateCounts() {
    const aCounts = calculateCounts(editorAlice.getDocument());
    aliceStats.textContent = `Words: ${aCounts.words} | Chars: ${aCounts.characters} | Paragraphs: ${aCounts.paragraphs}`;

    const bCounts = calculateCounts(editorBob.getDocument());
    bobStats.textContent = `Words: ${bCounts.words} | Chars: ${bCounts.characters} | Paragraphs: ${bCounts.paragraphs}`;

    const sCounts = calculateCounts(editorSingle.getDocument());
    singleStats.textContent = `Words: ${sCounts.words} | Chars: ${sCounts.characters} | Paragraphs: ${sCounts.paragraphs}`;
  }

  updateCounts();

  // Theme switch listeners
  header.querySelector('#theme-brand')?.addEventListener('click', () => applyTheme(rootElement, AURORA_BRAND_THEME));
  header.querySelector('#theme-light')?.addEventListener('click', () => applyTheme(rootElement, LIGHT_THEME));
  header.querySelector('#theme-contrast')?.addEventListener('click', () => applyTheme(rootElement, HIGH_CONTRAST_THEME));

  // Connect real-time WebSocket
  connectWs();

  return { editorAlice, editorBob, editorSingle };
}

if (typeof window !== 'undefined' && document.getElementById('app')) {
  initPlayground(document.getElementById('app')!);
}
