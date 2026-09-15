import { createEditor } from '@aurora/editor';
import {
  createToolbar,
  createBubbleMenu,
  createSlashMenu,
  createInplaceContextMenu,
  createSourceModeView,
  createPresenceManager,
  createReviewGutter,
  applyTheme,
  createThemeManager,
  AURORA_BRAND_THEME
} from '@aurora/ui';
import { calculateCounts, defaultSlashCommands, cleanPastedHtml, formatHtml } from '@aurora/features';
import type { AuroraDocument, JsonPatch } from '@aurora/model';
import { insertSampleCallout } from './examples/custom-block.js';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { ReactEditorApp } from './react-showcase.js';
import { mountAngularShowcase } from './angular-showcase.js';

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
      type: 'paragraph',
      content: [
        {
          type: 'text',
          text: 'Explore online documentation and guides at '
        },
        {
          type: 'text',
          text: 'https://aurora-rte.dev',
          marks: [{ type: 'link', attrs: { href: 'https://aurora-rte.dev', target: '_blank' } }]
        },
        {
          type: 'text',
          text: ' (click or right-click to trigger in-place link actions).'
        }
      ]
    },
    {
      type: 'image',
      attrs: {
        src: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=700&auto=format&fit=crop&q=80',
        alt: 'Aurora RTE Color Gradient',
        title: 'Aurora RTE Visual'
      }
    },
    {
      type: 'table',
      attrs: { rows: 2, cols: 3 },
      content: [
        {
          type: 'table_row',
          content: [
            {
              type: 'table_header',
              content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Feature' }] }]
            },
            {
              type: 'table_header',
              content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Capability' }] }]
            },
            {
              type: 'table_header',
              content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Status' }] }]
            }
          ]
        },
        {
          type: 'table_row',
          content: [
            {
              type: 'table_cell',
              content: [{ type: 'paragraph', content: [{ type: 'text', text: 'In-place Menus' }] }]
            },
            {
              type: 'table_cell',
              content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Tables, Images & Links' }] }]
            },
            {
              type: 'table_cell',
              content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Production Ready' }] }]
            }
          ]
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
        <h2 style="margin: 0; font-size: 1.5rem; color: var(--aurora-primary, #28E6F5); letter-spacing: -0.02em;">
          Aurora Editor Playground
        </h2>
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
      <div style="display: flex; align-items: center; gap: 8px; background: rgba(255,255,255,0.06); padding: 5px 10px; border-radius: 8px; border: 1px solid var(--aurora-border, rgba(255,255,255,0.1));">
        <label for="theme-preset-select" style="font-size: 0.8rem; font-weight: 600; color: var(--aurora-muted-fg, #8ca0c2); white-space: nowrap;">Theme / SaaS:</label>
        <select id="theme-preset-select" style="background: rgba(0,0,0,0.3); color: var(--aurora-fg, #f0f4f8); border: 1px solid var(--aurora-border, #132a59); border-radius: 4px; padding: 4px 8px; font-size: 0.8rem; cursor: pointer; outline: none;">
          <option value="auto">Auto-Inherit Host</option>
          <option value="aurora-dark" selected>Aurora Dark (Default)</option>
          <option value="aurora-light">Aurora Light</option>
          <option value="shadcn-dark">Shadcn / Tailwind Dark</option>
          <option value="shadcn-light">Shadcn / Tailwind Light</option>
          <option value="linear-dark">Linear Dark</option>
          <option value="enterprise-slate">Enterprise Slate</option>
          <option value="material-dark">Material 3 Dark</option>
          <option value="material-light">Material 3 Light</option>
          <option value="high-contrast">High Contrast (A11y)</option>
        </select>
        <div style="display: flex; align-items: center; gap: 4px;" title="Custom Brand Primary Color">
          <input type="color" id="theme-brand-color" value="#28E6F5" style="width: 24px; height: 24px; border: none; border-radius: 4px; cursor: pointer; background: transparent; padding: 0;" />
        </div>
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
    <button id="tab-react" style="padding: 10px 18px; font-size: 0.95rem; font-weight: 600; cursor: pointer; border: none; border-bottom: 3px solid transparent; background: transparent; color: var(--aurora-muted-fg, #8ca0c2); border-radius: 6px 6px 0 0;">
      ⚛️ React 19 Native Showcase
    </button>
    <button id="tab-angular" style="padding: 10px 18px; font-size: 0.95rem; font-weight: 600; cursor: pointer; border: none; border-bottom: 3px solid transparent; background: transparent; color: var(--aurora-muted-fg, #8ca0c2); border-radius: 6px 6px 0 0;">
      🅰️ Angular 17+ Showcase
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

  const reactPane = document.createElement('div');
  reactPane.id = 'pane-react';
  reactPane.style.display = 'none';
  container.appendChild(reactPane);

  const angularPane = document.createElement('div');
  angularPane.id = 'pane-angular';
  angularPane.style.display = 'none';
  container.appendChild(angularPane);

  const modelPane = document.createElement('div');
  modelPane.id = 'pane-model';
  modelPane.style.display = 'none';
  container.appendChild(modelPane);

  rootElement.appendChild(container);

  let reactMounted = false;
  let angularMounted = false;

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
  const tabReact = nav.querySelector('#tab-react') as HTMLButtonElement;
  const tabAngular = nav.querySelector('#tab-angular') as HTMLButtonElement;
  const tabModel = nav.querySelector('#tab-model') as HTMLButtonElement;

  function switchTab(activeTab: 'collab' | 'single' | 'react' | 'angular' | 'model') {
    [tabCollab, tabSingle, tabReact, tabAngular, tabModel].forEach((b) => {
      b.style.borderBottomColor = 'transparent';
      b.style.background = 'transparent';
      b.style.color = 'var(--aurora-muted-fg, #8ca0c2)';
    });

    collabPane.style.display = 'none';
    singlePane.style.display = 'none';
    reactPane.style.display = 'none';
    angularPane.style.display = 'none';
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
    } else if (activeTab === 'react') {
      tabReact.style.borderBottomColor = '#00F0FF';
      tabReact.style.background = 'rgba(0,240,255,0.08)';
      tabReact.style.color = '#00F0FF';
      reactPane.style.display = 'block';
      if (!reactMounted) {
        createRoot(reactPane).render(React.createElement(ReactEditorApp));
        reactMounted = true;
      }
    } else if (activeTab === 'angular') {
      tabAngular.style.borderBottomColor = '#DD0031';
      tabAngular.style.background = 'rgba(221,0,49,0.08)';
      tabAngular.style.color = '#FF4D6D';
      angularPane.style.display = 'block';
      if (!angularMounted) {
        mountAngularShowcase(angularPane);
        angularMounted = true;
      }
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
  tabReact.addEventListener('click', () => switchTab('react'));
  tabAngular.addEventListener('click', () => switchTab('angular'));
  tabModel.addEventListener('click', () => switchTab('model'));

  // -------------------------------------------------------------
  // 1. COLLABORATIVE EDITING PANE (Alice & Bob Split View)
  // -------------------------------------------------------------
  collabPane.innerHTML = `
    <div style="background: var(--aurora-muted-bg); border: 1px solid var(--aurora-border); border-radius: 8px; padding: 16px; margin-bottom: 20px;">
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
        <div>
          <h3 style="margin: 0; font-size: 1.15rem; color: var(--aurora-primary);">👥 Real-Time Collaborative Synchronization Engine</h3>
          <p style="margin: 4px 0 0 0; font-size: 0.85rem; color: var(--aurora-muted-fg);">
            Changes typed in Alice immediately sync to Bob and vice versa. RFC 6902 JSON Patches are calculated, verified, and applied automatically.
          </p>
        </div>
        <div style="display: flex; gap: 8px; flex-wrap: wrap; align-items: center;">
          <div style="display: flex; align-items: center; gap: 6px; background: rgba(255,255,255,0.05); padding: 4px 8px; border-radius: 6px; border: 1px solid var(--aurora-border);">
            <label for="select-collab-debounce" style="font-size: 0.8rem; font-weight: 600; color: var(--aurora-muted-fg);">Debounce:</label>
            <select id="select-collab-debounce" style="padding: 4px 8px; font-size: 0.8rem; border-radius: 4px; border: 1px solid var(--aurora-border); background: var(--aurora-bg); color: var(--aurora-fg); outline: none; cursor: pointer;">
              <option value="150">150ms (Ultra-Low)</option>
              <option value="300" selected>300ms (Industry Standard)</option>
              <option value="500">500ms (Conservative)</option>
              <option value="0">0ms (Instant Thrash)</option>
            </select>
          </div>
          <button id="btn-collab-type-alice" style="padding: 6px 12px; font-size: 0.85rem; border-radius: 4px; border: 1px solid var(--aurora-primary); background: transparent; color: var(--aurora-primary); cursor: pointer;">
            ⚡ Alice Types Paragraph
          </button>
          <button id="btn-collab-bold-bob" style="padding: 6px 12px; font-size: 0.85rem; border-radius: 4px; border: 1px solid var(--aurora-secondary, #25E0C4); background: transparent; color: var(--aurora-secondary, #25E0C4); cursor: pointer;">
            ⚡ Bob Inserts Table
          </button>
          <button id="btn-collab-comment" style="padding: 6px 12px; font-size: 0.85rem; border-radius: 4px; border: 1px solid #28E6F5; background: rgba(40,230,245,0.1); color: #28E6F5; cursor: pointer;">
            💬 Add Comment
          </button>
          <button id="btn-collab-suggest" style="padding: 6px 12px; font-size: 0.85rem; border-radius: 4px; border: 1px solid #00FF88; background: rgba(0,255,136,0.1); color: #00FF88; cursor: pointer;">
            📝 Suggest Change
          </button>
          <button id="btn-collab-reset" style="padding: 6px 12px; font-size: 0.85rem; border-radius: 4px; border: 1px solid var(--aurora-border); background: var(--aurora-bg); color: var(--aurora-fg); cursor: pointer;">
            🔄 Reset Doc
          </button>
        </div>
      </div>
    </div>

    <!-- Three-Column Layout: Alice, Bob, and Review Gutter -->
    <div style="display: grid; grid-template-columns: 1fr 1fr 310px; gap: 16px; margin-bottom: 20px;">
      <!-- ALICE PANEL -->
      <div style="background: var(--aurora-bg); border: 2px solid var(--aurora-primary); border-radius: 8px; padding: 14px; display: flex; flex-direction: column; position: relative;">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--aurora-border); padding-bottom: 8px; margin-bottom: 10px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="background: var(--aurora-primary); color: #040d21; font-weight: 700; font-size: 0.75rem; padding: 3px 8px; border-radius: 12px;">CLIENT 1</span>
            <strong style="color: var(--aurora-primary);">Alice (Lead Author)</strong>
          </div>
          <span id="alice-status" style="font-size: 0.8rem; color: var(--aurora-muted-fg);">Ready</span>
        </div>
        <div id="alice-toolbar" style="margin-bottom: 10px;"></div>
        <div id="alice-editor-mount" style="min-height: 220px; flex: 1; padding: 12px; border: 1px solid var(--aurora-border); border-radius: 6px; background: var(--aurora-bg); color: var(--aurora-fg); outline: none; position: relative;"></div>
        <div id="alice-stats" style="margin-top: 8px; font-size: 0.8rem; color: var(--aurora-muted-fg);">Words: 0 | Chars: 0</div>
      </div>

      <!-- BOB PANEL -->
      <div style="background: var(--aurora-bg); border: 2px solid var(--aurora-secondary, #25E0C4); border-radius: 8px; padding: 14px; display: flex; flex-direction: column; position: relative;">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--aurora-border); padding-bottom: 8px; margin-bottom: 10px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="background: var(--aurora-secondary, #25E0C4); color: #040d21; font-weight: 700; font-size: 0.75rem; padding: 3px 8px; border-radius: 12px;">CLIENT 2</span>
            <strong style="color: var(--aurora-secondary, #25E0C4);">Bob (Reviewer / Co-author)</strong>
          </div>
          <span id="bob-status" style="font-size: 0.8rem; color: var(--aurora-muted-fg);">Ready</span>
        </div>
        <div id="bob-toolbar" style="margin-bottom: 10px;"></div>
        <div id="bob-editor-mount" style="min-height: 220px; flex: 1; padding: 12px; border: 1px solid var(--aurora-border); border-radius: 6px; background: var(--aurora-bg); color: var(--aurora-fg); outline: none; position: relative;"></div>
        <div id="bob-stats" style="margin-top: 8px; font-size: 0.8rem; color: var(--aurora-muted-fg);">Words: 0 | Chars: 0</div>
      </div>

      <!-- REVIEW & SUGGESTIONS GUTTER -->
      <div id="collab-review-gutter-mount" style="background: var(--aurora-bg); border: 2px solid #132a59; border-radius: 8px; overflow: hidden; display: flex; flex-direction: column;">
      </div>
    </div>

    <!-- Live Patch & Transaction Log -->
    <div style="background: var(--aurora-muted-bg); border: 1px solid var(--aurora-border); border-radius: 8px; padding: 14px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
        <strong style="font-size: 0.9rem; color: var(--aurora-accent);">📡 Real-Time RFC 6902 JSON Patch & Event Stream</strong>
        <span id="patch-stats" style="font-size: 0.8rem; color: var(--aurora-muted-fg);">Patches exchanged: 0</span>
      </div>
      <div id="patch-log" style="height: 140px; overflow-y: auto; font-family: ui-monospace, monospace; font-size: 0.8rem; color: var(--aurora-fg); line-height: 1.5; padding: 8px; background: var(--aurora-bg); border-radius: 4px; border: 1px solid var(--aurora-border);">
        <div style="color: var(--aurora-muted-fg);">[System] Collaborative synchronization session initialized. Ready for keystrokes...</div>
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
  createInplaceContextMenu({ editor: editorAlice, container: rootElement });

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
  createInplaceContextMenu({ editor: editorBob, container: rootElement });

  // Collaborative Remote Carets Presence Managers
  const presenceAlice = createPresenceManager({ container: aliceMount });
  const presenceBob = createPresenceManager({ container: bobMount });

  // Initialize Collab Review & Suggestions Gutter
  const reviewMount = collabPane.querySelector('#collab-review-gutter-mount') as HTMLElement;
  const reviewGutter = createReviewGutter({
    container: reviewMount,
    currentUser: { id: myClientId, name: 'Alice (Lead Author)' },
    onAcceptSuggestion: (id) => {
      appendPatchLog('Review', `✓ Accepted suggestion: ${id}`, '#00FF88');
    },
    onRejectSuggestion: (id) => {
      appendPatchLog('Review', `✕ Rejected suggestion: ${id}`, '#FF2E93');
    },
    onResolveComment: (id) => {
      appendPatchLog('Review', `✓ Resolved comment: ${id}`, '#28E6F5');
    }
  });
  reviewMount.appendChild(reviewGutter.element);

  // Seed sample review comment & suggestion
  reviewGutter.addComment({
    id: 'cmt_1',
    author: { id: 'alice', name: 'Alice (Lead Author)' },
    text: 'Please review table column resizing and verify mobile layout integrity.',
    createdAt: new Date().toISOString(),
    anchor: { from: 20, to: 60, snippet: 'Aurora Editor' }
  });

  reviewGutter.addSuggestion({
    id: 'sug_1',
    mode: 'insert',
    author: { id: 'bob', name: 'Bob (Reviewer)' },
    suggestedText: 'Zero vendor lock-in SaaS compliance',
    createdAt: new Date().toISOString()
  });

  // Action buttons for review & comment
  collabPane.querySelector('#btn-collab-comment')?.addEventListener('click', () => {
    reviewGutter.addComment({
      id: `cmt_${Date.now()}`,
      author: { id: 'alice', name: 'Alice (Lead Author)' },
      text: 'Collaborative inline note added at ' + new Date().toLocaleTimeString(),
      createdAt: new Date().toISOString()
    });
  });

  collabPane.querySelector('#btn-collab-suggest')?.addEventListener('click', () => {
    reviewGutter.addSuggestion({
      id: `sug_${Date.now()}`,
      mode: 'insert',
      author: { id: 'bob', name: 'Bob (Reviewer)' },
      suggestedText: 'Enterprise WCAG AA standard compliant',
      createdAt: new Date().toISOString()
    });
  });

  // -------------------------------------------------------------
  // 2. SINGLE EDITOR SHOWCASE PANE
  // -------------------------------------------------------------
  singlePane.innerHTML = `
    <div style="margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
      <div>
        <h3 style="margin: 0; color: #28E6F5;">🌟 Complete Aurora RTE Feature Showcase</h3>
        <p style="margin: 2px 0 0 0; font-size: 0.85rem; color: var(--aurora-muted-fg, #8ca0c2);">Full formatting, slash commands (/), bubble menu, tables, custom callouts, and clean Word paste normalization.</p>
      </div>
      <div style="display: flex; gap: 8px; flex-wrap: wrap; align-items: center;">
        <div style="display: flex; align-items: center; gap: 6px; background: rgba(255,255,255,0.05); padding: 4px 8px; border-radius: 6px; border: 1px solid var(--aurora-border);">
          <label for="select-doc-template" style="font-size: 0.8rem; font-weight: 600; color: var(--aurora-muted-fg);">Template:</label>
          <select id="select-doc-template" style="padding: 4px 8px; font-size: 0.8rem; border-radius: 4px; border: 1px solid var(--aurora-border); background: var(--aurora-bg); color: var(--aurora-fg); outline: none; cursor: pointer;">
            <option value="default" selected>Default Workspace</option>
            <option value="article">Semantic Article (Figure + Details)</option>
            <option value="table">Accessible Table (Sizing & Header)</option>
            <option value="form">Interactive Form & Dialog</option>
          </select>
        </div>
        <div style="display: inline-flex; background: rgba(255,255,255,0.06); padding: 3px; border-radius: 6px; border: 1px solid var(--aurora-border);">
          <button id="btn-mode-edit" style="padding: 5px 12px; font-size: 0.85rem; font-weight: 600; border-radius: 4px; border: none; background: var(--aurora-primary); color: #040d21; cursor: pointer; transition: all 0.15s ease;">✏️ Edit Mode</button>
          <button id="btn-mode-view" style="padding: 5px 12px; font-size: 0.85rem; font-weight: 600; border-radius: 4px; border: none; background: transparent; color: var(--aurora-fg); cursor: pointer; transition: all 0.15s ease;">👁️ View Mode</button>
        </div>
        <button id="btn-mode-source" style="padding: 5px 12px; font-size: 0.85rem; font-weight: 600; border-radius: 4px; border: 1px solid var(--aurora-primary); background: transparent; color: var(--aurora-primary); cursor: pointer; transition: all 0.15s ease;">
          &lt;/&gt; Source Mode
        </button>
        <button id="btn-insert-callout" style="padding: 6px 12px; font-size: 0.85rem; border-radius: 4px; border: 1px solid rgba(40,230,245,0.4); background: rgba(40,230,245,0.1); color: #28E6F5; cursor: pointer;">
          + Custom Callout Block
        </button>
        <button id="btn-insert-table" style="padding: 6px 12px; font-size: 0.85rem; border-radius: 4px; border: 1px solid rgba(37,224,196,0.4); background: rgba(37,224,196,0.1); color: #25E0C4; cursor: pointer;">
          + Insert Table (3x3)
        </button>
      </div>
    </div>

    <!-- Toolbar Customizer Drawer -->
    <div style="background: rgba(40, 230, 245, 0.05); border: 1px solid var(--aurora-border); border-radius: 8px; padding: 12px 16px; margin-bottom: 16px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; flex-wrap: wrap; gap: 8px;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="font-size: 1.1rem;">⚙️</span>
          <strong style="color: var(--aurora-primary); font-size: 0.95rem;">Interactive Toolbar & Menu Customizer</strong>
          <span style="font-size: 0.8rem; color: var(--aurora-muted-fg);">(User customizable: toggle presets & individual controls live)</span>
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <label style="font-size: 0.85rem; font-weight: 600;">Toolbar Preset:</label>
          <select id="select-toolbar-preset" style="padding: 5px 10px; border-radius: 6px; border: 1px solid var(--aurora-border); background: var(--aurora-bg); color: var(--aurora-fg); outline: none; font-size: 0.85rem; cursor: pointer;">
            <option value="full" selected>Full (All Features)</option>
            <option value="standard">Standard (Streamlined)</option>
            <option value="minimal">Minimal (Distraction-Free)</option>
          </select>
        </div>
      </div>
      <div style="display: flex; gap: 14px; flex-wrap: wrap; font-size: 0.85rem; align-items: center; padding-top: 6px; border-top: 1px solid rgba(255,255,255,0.06);">
        <span style="color: var(--aurora-muted-fg); font-weight: 600;">Toggle Features:</span>
        <label style="display: flex; align-items: center; gap: 4px; cursor: pointer;">
          <input type="checkbox" id="toggle-typography" checked> Typography (Fonts/Sizes)
        </label>
        <label style="display: flex; align-items: center; gap: 4px; cursor: pointer;">
          <input type="checkbox" id="toggle-colors" checked> Color Pickers
        </label>
        <label style="display: flex; align-items: center; gap: 4px; cursor: pointer;">
          <input type="checkbox" id="toggle-align" checked> Alignment
        </label>
        <label style="display: flex; align-items: center; gap: 4px; cursor: pointer;">
          <input type="checkbox" id="toggle-table-tools" checked> Table Tools
        </label>
        <label style="display: flex; align-items: center; gap: 4px; cursor: pointer;">
          <input type="checkbox" id="toggle-history" checked> Undo / Redo
        </label>
      </div>
    </div>

    <div id="single-toolbar" style="margin-bottom: 12px;"></div>
    <div id="single-editor-mount" style="min-height: 350px; padding: 20px; border: 1px solid var(--aurora-border); border-radius: 8px; background: var(--aurora-bg); color: var(--aurora-fg); outline: none;"></div>
    <div id="single-stats" style="margin-top: 10px; font-size: 0.85rem; color: var(--aurora-muted-fg);"></div>
    <div id="single-source-container" style="display: none; margin-top: 14px;"></div>
  `;

  const singleMount = singlePane.querySelector('#single-editor-mount') as HTMLElement;
  const singleToolbar = singlePane.querySelector('#single-toolbar') as HTMLElement;
  const singleStats = singlePane.querySelector('#single-stats') as HTMLElement;

  const editorSingle = createEditor({
    element: singleMount,
    document: JSON.parse(JSON.stringify(initialDoc))
  });

  let currentToolbarInstance: any = null;
  function mountSingleToolbar(preset: 'full' | 'standard' | 'minimal' = 'full') {
    if (currentToolbarInstance) {
      currentToolbarInstance.destroy();
      singleToolbar.innerHTML = '';
    }

    const hiddenItems: string[] = [];
    const toggleTypo = singlePane.querySelector<HTMLInputElement>('#toggle-typography');
    const toggleColors = singlePane.querySelector<HTMLInputElement>('#toggle-colors');
    const toggleAlign = singlePane.querySelector<HTMLInputElement>('#toggle-align');
    const toggleTable = singlePane.querySelector<HTMLInputElement>('#toggle-table-tools');
    const toggleHist = singlePane.querySelector<HTMLInputElement>('#toggle-history');

    if (toggleTypo && !toggleTypo.checked) {
      hiddenItems.push('fontFamily', 'fontSize');
    }
    if (toggleColors && !toggleColors.checked) {
      hiddenItems.push('textColor', 'textHighlight', 'clearFormatting');
    }
    if (toggleAlign && !toggleAlign.checked) {
      hiddenItems.push('align');
    }
    if (toggleTable && !toggleTable.checked) {
      hiddenItems.push('tableMenu');
    }
    if (toggleHist && !toggleHist.checked) {
      hiddenItems.push('undo', 'redo');
    }

    currentToolbarInstance = createToolbar({
      editor: editorSingle,
      container: singleToolbar,
      config: {
        preset,
        hiddenItems,
        onAction: (act) => {
          appendPatchLog('Showcase', `Executed action: ${act}`);
        }
      }
    });
  }

  mountSingleToolbar('full');
  createBubbleMenu({ editor: editorSingle, container: rootElement });
  createSlashMenu({ editor: editorSingle, container: rootElement, commands: defaultSlashCommands() });
  createInplaceContextMenu({ editor: editorSingle, container: rootElement });

  // Connect Mode Switcher (Edit vs View Mode)
  const btnModeEdit = singlePane.querySelector<HTMLButtonElement>('#btn-mode-edit');
  const btnModeView = singlePane.querySelector<HTMLButtonElement>('#btn-mode-view');
  const customizerDrawer = singlePane.querySelector('div[style*="Interactive Toolbar & Menu Customizer"]')?.parentElement as HTMLElement | null;

  function updateModeUI(isEditable: boolean) {
    editorSingle.setEditable(isEditable);
    if (btnModeEdit && btnModeView) {
      if (isEditable) {
        btnModeEdit.style.background = 'var(--aurora-primary)';
        btnModeEdit.style.color = '#040d21';
        btnModeView.style.background = 'transparent';
        btnModeView.style.color = 'var(--aurora-fg)';
        singleToolbar.style.display = '';
        if (customizerDrawer) customizerDrawer.style.display = '';
      } else {
        btnModeEdit.style.background = 'transparent';
        btnModeEdit.style.color = 'var(--aurora-fg)';
        btnModeView.style.background = 'var(--aurora-primary)';
        btnModeView.style.color = '#040d21';
        singleToolbar.style.display = 'none';
        if (customizerDrawer) customizerDrawer.style.display = 'none';
      }
    }
    appendPatchLog('Showcase', `Switched mode to: ${isEditable ? '✏️ Edit Mode' : '👁️ View Mode'}`);
  }

  btnModeEdit?.addEventListener('click', () => updateModeUI(true));
  btnModeView?.addEventListener('click', () => updateModeUI(false));

  // Semantic Scaffolds and Document Templates
  const PLAYGROUND_TEMPLATES: Record<string, AuroraDocument> = {
    default: initialDoc,
    article: {
      format: 'aurora',
      version: 1,
      content: [
        { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'Semantic HTML5 Architecture & Scaffolds' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'This semantic article is authored according to WCAG AA accessibility standards.' }] },
        {
          type: 'image',
          attrs: {
            src: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=700&auto=format&fit=crop&q=80',
            alt: 'Cloud Architecture Dashboard',
            title: 'Cloud Spec'
          }
        },
        {
          type: 'table',
          attrs: { rows: 2, cols: 3, width: '100%', bordered: true, headerRow: true },
          content: [
            {
              type: 'table_row',
              content: [
                { type: 'table_header', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Component' }] }] },
                { type: 'table_header', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Role' }] }] },
                { type: 'table_header', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Status' }] }] }
              ]
            },
            {
              type: 'table_row',
              content: [
                { type: 'table_cell', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Source Mode' }] }] },
                { type: 'table_cell', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Live 2-way HTML' }] }] },
                { type: 'table_cell', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Active' }] }] }
              ]
            }
          ]
        }
      ]
    },
    table: {
      format: 'aurora',
      version: 1,
      content: [
        { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'Accessible Data Table with Column & Row Sizing' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Hover over the right border of any column or bottom border of any row to resize interactively.' }] },
        {
          type: 'table',
          attrs: { rows: 3, cols: 3, width: '100%', bordered: true, headerRow: true },
          content: [
            {
              type: 'table_row',
              attrs: { height: '40px' },
              content: [
                { type: 'table_header', attrs: { colwidth: [180] }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Feature' }] }] },
                { type: 'table_header', attrs: { colwidth: [240] }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Description' }] }] },
                { type: 'table_header', attrs: { colwidth: [160] }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Compliance' }] }] }
              ]
            },
            {
              type: 'table_row',
              content: [
                { type: 'table_cell', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Column Width' }] }] },
                { type: 'table_cell', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Drag cyan handle or preset' }] }] },
                { type: 'table_cell', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'WCAG Table Spec' }] }] }
              ]
            },
            {
              type: 'table_row',
              content: [
                { type: 'table_cell', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Row Height' }] }] },
                { type: 'table_cell', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Drag emerald handle or preset' }] }] },
                { type: 'table_cell', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'WCAG Table Spec' }] }] }
              ]
            }
          ]
        }
      ]
    },
    form: {
      format: 'aurora',
      version: 1,
      content: [
        { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'Interactive Forms & Dialog Scaffolding' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Demonstrating HTML5 form controls and accessible dialogs in developer mode.' }] }
      ]
    }
  };

  const selectDocTemplate = singlePane.querySelector<HTMLSelectElement>('#select-doc-template');
  selectDocTemplate?.addEventListener('change', () => {
    const key = selectDocTemplate.value;
    const tpl = PLAYGROUND_TEMPLATES[key] || PLAYGROUND_TEMPLATES.default;
    isSyncing = true;
    try {
      editorSingle.setDocument(tpl);
      editorAlice.setDocument(tpl);
      editorBob.setDocument(tpl);
    } finally {
      isSyncing = false;
    }
    sourceModeView.setHtml(editorSingle.export({ format: 'html' }));
    updateCounts();
    appendPatchLog('Showcase', `Loaded template: ${key}`);
  });

  // Connect Bi-directional Source Mode
  const singleSourceContainer = singlePane.querySelector('#single-source-container') as HTMLElement;
  const sourceModeView = createSourceModeView(editorSingle.export({ format: 'html' }), {
    onHtmlChange: (cleanHtml) => {
      editorSingle.execute('insertHtml', { html: cleanHtml });
      appendPatchLog('Source Mode', 'Synchronized sanitized HTML into rich text editor', '#25E0C4');
      updateCounts();
    }
  });
  singleSourceContainer.appendChild(sourceModeView.element);

  let isSourceModeOpen = false;
  const btnModeSource = singlePane.querySelector('#btn-mode-source') as HTMLButtonElement;
  btnModeSource?.addEventListener('click', () => {
    isSourceModeOpen = !isSourceModeOpen;
    if (isSourceModeOpen) {
      btnModeSource.style.background = 'var(--aurora-primary)';
      btnModeSource.style.color = '#040d21';
      sourceModeView.setHtml(editorSingle.export({ format: 'html' }));
      singleSourceContainer.style.display = 'block';
    } else {
      btnModeSource.style.background = 'transparent';
      btnModeSource.style.color = 'var(--aurora-primary)';
      singleSourceContainer.style.display = 'none';
    }
    appendPatchLog('Showcase', `Source mode ${isSourceModeOpen ? 'opened' : 'closed'}`);
  });

  // Connect Toolbar Customizer event listeners
  const presetSelect = singlePane.querySelector<HTMLSelectElement>('#select-toolbar-preset');
  presetSelect?.addEventListener('change', () => {
    mountSingleToolbar((presetSelect.value as any) || 'full');
  });

  ['#toggle-typography', '#toggle-colors', '#toggle-align', '#toggle-table-tools', '#toggle-history'].forEach((sel) => {
    singlePane.querySelector(sel)?.addEventListener('change', () => {
      mountSingleToolbar((presetSelect?.value as any) || 'full');
    });
  });

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
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; flex-wrap: wrap; gap: 8px;">
      <div>
        <h3 style="margin: 0; color: var(--aurora-primary);">📦 Canonical Aurora Document AST & Format Exporter</h3>
        <p style="margin: 2px 0 0 0; font-size: 0.85rem; color: var(--aurora-muted-fg);">Deterministic serialization, strict schema bounds, and loss-free export to CommonMark & safe HTML.</p>
      </div>
      <div style="display: flex; gap: 8px;">
        <button id="btn-export-json" class="aurora-export-btn is-active" style="padding: 6px 14px; font-size: 0.85rem; font-weight: 600; border-radius: 6px; border: 1px solid var(--aurora-primary); background: var(--aurora-primary); color: #040d21; cursor: pointer; transition: all 0.15s ease;">JSON AST</button>
        <button id="btn-export-html" class="aurora-export-btn" style="padding: 6px 14px; font-size: 0.85rem; font-weight: 600; border-radius: 6px; border: 1px solid var(--aurora-border); background: var(--aurora-muted-bg); color: var(--aurora-fg); cursor: pointer; transition: all 0.15s ease;">Formatted HTML</button>
        <button id="btn-export-md" class="aurora-export-btn" style="padding: 6px 14px; font-size: 0.85rem; font-weight: 600; border-radius: 6px; border: 1px solid var(--aurora-border); background: var(--aurora-muted-bg); color: var(--aurora-fg); cursor: pointer; transition: all 0.15s ease;">Markdown</button>
      </div>
    </div>
    <pre id="model-output" style="background: var(--aurora-muted-bg); border: 1px solid var(--aurora-border); border-radius: 8px; padding: 18px; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 0.85rem; color: var(--aurora-fg); max-height: 520px; overflow: auto; line-height: 1.6; white-space: pre-wrap; word-break: break-word; tab-size: 2; box-shadow: inset 0 2px 8px rgba(0,0,0,0.15);"></pre>
  `;

  let currentExportFormat: 'json' | 'html' | 'markdown' = 'json';

  const btnExportJson = modelPane.querySelector('#btn-export-json') as HTMLButtonElement;
  const btnExportHtml = modelPane.querySelector('#btn-export-html') as HTMLButtonElement;
  const btnExportMd = modelPane.querySelector('#btn-export-md') as HTMLButtonElement;

  function updateExportButtons(activeBtn: HTMLButtonElement) {
    [btnExportJson, btnExportHtml, btnExportMd].forEach((b) => {
      if (!b) return;
      b.classList.remove('is-active');
      b.style.border = '1px solid var(--aurora-border)';
      b.style.background = 'var(--aurora-muted-bg)';
      b.style.color = 'var(--aurora-fg)';
    });
    activeBtn.classList.add('is-active');
    activeBtn.style.border = '1px solid var(--aurora-primary)';
    activeBtn.style.background = 'var(--aurora-primary)';
    activeBtn.style.color = '#040d21';
  }

  function refreshModelView() {
    const pre = modelPane.querySelector('#model-output') as HTMLPreElement;
    if (!pre) return;
    const doc = editorSingle.getDocument();
    if (currentExportFormat === 'json') {
      pre.textContent = JSON.stringify(doc, null, 2);
    } else if (currentExportFormat === 'html') {
      const rawHtml = editorSingle.export({ format: 'html' });
      pre.textContent = formatHtml(rawHtml);
    } else {
      pre.textContent = editorSingle.export({ format: 'markdown' });
    }
  }

  btnExportJson?.addEventListener('click', () => {
    currentExportFormat = 'json';
    updateExportButtons(btnExportJson);
    refreshModelView();
  });
  btnExportHtml?.addEventListener('click', () => {
    currentExportFormat = 'html';
    updateExportButtons(btnExportHtml);
    refreshModelView();
  });
  btnExportMd?.addEventListener('click', () => {
    currentExportFormat = 'markdown';
    updateExportButtons(btnExportMd);
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

  // Industry Standard Debounce Manager (300ms default, maxWait 800ms)
  let collabDebounceMs = 300;
  const selectDebounce = collabPane.querySelector<HTMLSelectElement>('#select-collab-debounce');
  selectDebounce?.addEventListener('change', () => {
    collabDebounceMs = parseInt(selectDebounce.value, 10);
    appendPatchLog('System', `Collab network sync debounce set to: ${collabDebounceMs}ms`, '#f59e0b');
  });

  function createDebouncedSync(
    senderId: string,
    senderName: string,
    onStatusChange: (status: string) => void,
    onPartnerStatusChange: (status: string) => void,
    syncToPartners: (doc: AuroraDocument) => void,
    logColor: string
  ) {
    let timer: any = null;
    let maxWaitTimer: any = null;
    let pendingDoc: AuroraDocument | null = null;
    let pendingPatches: JsonPatch[] = [];
    let pendingTxId: string = '';

    function flush() {
      if (!pendingDoc) return;
      clearTimeout(timer);
      clearTimeout(maxWaitTimer);
      timer = null;
      maxWaitTimer = null;

      const docToSync = pendingDoc;
      const patchesToSync = [...pendingPatches];
      const txId = pendingTxId;
      pendingDoc = null;
      pendingPatches = [];

      isSyncing = true;
      try {
        syncToPartners(docToSync);
      } finally {
        isSyncing = false;
      }

      appendPatchLog(
        `${senderName} (Network Synced)`,
        `Aggregated & dispatched ${patchesToSync.length} patch(es) (${collabDebounceMs}ms debounce window)`,
        logColor
      );
      broadcastChange(senderId, senderName, docToSync, patchesToSync, txId);

      onStatusChange('Synced');
      onPartnerStatusChange(`Synced with ${senderName}`);
    }

    return {
      enqueue(document: AuroraDocument, patches: readonly JsonPatch[], transactionId: string, immediate: boolean = false) {
        pendingDoc = document;
        pendingPatches.push(...patches);
        pendingTxId = transactionId;

        if (immediate || collabDebounceMs === 0) {
          flush();
          return;
        }

        onStatusChange(`⏳ Debouncing (${collabDebounceMs}ms)...`);
        onPartnerStatusChange(`Receiving ${senderName} keystrokes...`);

        clearTimeout(timer);
        timer = setTimeout(flush, collabDebounceMs);

        if (!maxWaitTimer) {
          maxWaitTimer = setTimeout(flush, Math.max(800, collabDebounceMs * 2));
        }
      },
      flushImmediate() {
        flush();
      }
    };
  }

  // Alice Debounced Sync
  const aliceSync = createDebouncedSync(
    'alice',
    'Alice (Client 1)',
    (status) => { aliceStatus.textContent = status; },
    (status) => { bobStatus.textContent = status; },
    (doc) => {
      editorBob.setDocument(doc);
      editorSingle.setDocument(doc);
    },
    '#28E6F5'
  );

  // Bob Debounced Sync
  const bobSync = createDebouncedSync(
    'bob',
    'Bob (Client 2)',
    (status) => { bobStatus.textContent = status; },
    (status) => { aliceStatus.textContent = status; },
    (doc) => {
      editorAlice.setDocument(doc);
      editorSingle.setDocument(doc);
    },
    '#25E0C4'
  );

  // Alice Change Listener
  editorAlice.on('change', ({ document, patches, origin, transactionId }) => {
    if (isSyncing) return;
    if (origin === 'user' || origin === 'command') {
      const isBlockCommand = origin === 'command';
      aliceSync.enqueue(document, patches, transactionId, isBlockCommand);
      presenceBob.updatePeer({
        id: 'alice',
        name: 'Alice (Lead Author)',
        color: '#FF2E93',
        active: true,
        cursor: { from: 10, to: 10 }
      });
    }
    updateCounts();
  });

  // Bob Change Listener
  editorBob.on('change', ({ document, patches, origin, transactionId }) => {
    if (isSyncing) return;
    if (origin === 'user' || origin === 'command') {
      const isBlockCommand = origin === 'command';
      bobSync.enqueue(document, patches, transactionId, isBlockCommand);
      presenceAlice.updatePeer({
        id: 'bob',
        name: 'Bob (Reviewer)',
        color: '#00F0FF',
        active: true,
        cursor: { from: 15, to: 15 }
      });
    }
    updateCounts();
  });

  // Single Editor Change Listener
  editorSingle.on('change', ({ document, patches, origin, transactionId }) => {
    sourceModeView.setHtml(editorSingle.export({ format: 'html' }));
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

  // SaaS Theme Manager Integration
  const themeSelect = header.querySelector('#theme-preset-select') as HTMLSelectElement;
  const themeColorPicker = header.querySelector('#theme-brand-color') as HTMLInputElement;

  const themeManager = createThemeManager({
    target: rootElement,
    theme: 'aurora-dark',
    onThemeChange: (_name, tokens) => {
      if (themeColorPicker && tokens.primary) {
        // Keep picker synced if valid hex
        if (tokens.primary.startsWith('#') && tokens.primary.length === 7) {
          themeColorPicker.value = tokens.primary;
        }
      }
    }
  });

  themeSelect?.addEventListener('change', () => {
    const selected = themeSelect.value;
    if (selected === 'auto') {
      themeManager.setAutoInherit(true);
      themeManager.setTheme('auto');
    } else {
      themeManager.setAutoInherit(false);
      themeManager.setTheme(selected);
    }
  });

  themeColorPicker?.addEventListener('input', (e) => {
    const newColor = (e.target as HTMLInputElement).value;
    themeManager.setTokens({
      primary: newColor,
      primaryHover: newColor,
      resizeHandle: newColor
    });
  });

  // Connect real-time WebSocket
  connectWs();

  return Object.assign(editorSingle, { editorAlice, editorBob, editorSingle });
}

if (typeof window !== 'undefined' && document.getElementById('app')) {
  initPlayground(document.getElementById('app')!);
}
