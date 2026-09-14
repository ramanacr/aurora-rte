import { describe, it, expect } from 'vitest';
import {
  formatRawHtml,
  createSourceModeView,
  createPresenceManager,
  createReviewGutter
} from '../src/index.js';

describe('Source Mode & Code Editor Integration', () => {
  it('formats raw unindented HTML with clean multi-line hierarchy', () => {
    const raw = '<article><h1>Title</h1><p>Text</p><footer>End</footer></article>';
    const formatted = formatRawHtml(raw);
    expect(formatted).toContain('<article>');
    expect(formatted).toContain('  <h1>');
    expect(formatted).toContain('  <p>');
    expect(formatted).toContain('</article>');
  });

  it('creates source mode view and synchronizes sanitized HTML', async () => {
    let synced = '';
    const view = createSourceModeView('<p>Hello</p>', {
      debounceMs: 50,
      onHtmlChange: (cleanHtml) => {
        synced = cleanHtml;
      }
    });

    expect(view.element).toBeTruthy();
    expect(view.getHtml()).toContain('<p>');

    // Simulate input with legacy tag to verify pipeline
    const textarea = view.element.querySelector('textarea') as HTMLTextAreaElement;
    textarea.value = '<center>Centered text</center>';
    textarea.dispatchEvent(new Event('input'));

    await new Promise((r) => setTimeout(r, 80));
    // Verify legacy migration changed <center> to <div style="text-align: center;">
    expect(synced).toContain('text-align: center');
    view.destroy();
  });
});

describe('Collaborative Presence Manager', () => {
  it('registers peers and renders carets with badges', () => {
    const container = document.createElement('div');
    const manager = createPresenceManager({ container });

    manager.updatePeer({
      id: 'alice',
      name: 'Alice',
      color: '#FF2E93',
      active: true,
      cursor: { from: 5, to: 10 }
    });

    const peers = manager.getPeers();
    expect(peers).toHaveLength(1);
    expect(peers[0].name).toBe('Alice');

    const caret = container.querySelector('.aurora-peer-alice');
    expect(caret).toBeTruthy();
    expect(caret?.textContent).toContain('Alice');

    manager.destroy();
  });
});

describe('Review Gutter & Track Changes', () => {
  it('handles comments and suggestions lifecycle', () => {
    const container = document.createElement('div');
    let acceptedId = '';

    const gutter = createReviewGutter({
      container,
      currentUser: { id: 'user-1', name: 'Bob' },
      onAcceptSuggestion: (id) => {
        acceptedId = id;
      }
    });

    gutter.addComment({
      id: 'c1',
      author: { id: 'u2', name: 'Alice' },
      text: 'Great point here!',
      createdAt: new Date().toISOString()
    });

    gutter.addSuggestion({
      id: 's1',
      mode: 'insert',
      author: { id: 'u2', name: 'Alice' },
      suggestedText: 'additional text',
      createdAt: new Date().toISOString()
    });

    expect(gutter.element.textContent).toContain('Alice');
    expect(gutter.element.textContent).toContain('Great point here!');
    expect(gutter.element.textContent).toContain('additional text');

    // Click Accept button
    const acceptBtn = gutter.element.querySelector('.accept-btn') as HTMLButtonElement;
    acceptBtn?.click();
    expect(acceptedId).toBe('s1');

    gutter.destroy();
  });
});
