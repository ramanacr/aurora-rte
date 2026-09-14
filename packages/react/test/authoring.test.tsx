// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest';
import { createRef, act } from 'react';
import { createRoot } from 'react-dom/client';
import {
  AuroraEditor,
  AuroraProvider,
  useHtmlRegistry,
  useRteContext,
  useCommandPalette,
  useElementInspector,
  type AuroraEditorRef
} from '../src/index.js';
import type { AuroraDocument } from '@aurora/model';

const testDoc: AuroraDocument = {
  format: 'aurora',
  version: 1,
  content: [{ type: 'paragraph', content: [{ type: 'text', text: 'React HTML Authoring' }] }]
};

function TestConsumer({ onReady }: { onReady: (data: any) => void }) {
  const registry = useHtmlRegistry();
  const context = useRteContext();
  const palette = useCommandPalette();
  const inspector = useElementInspector();

  onReady({ registry, context, palette, inspector });
  return <div data-testid="consumer">Rendered</div>;
}

describe('React HTML Authoring Integration', () => {
  it('mounts AuroraEditor with integrated HTML authoring toolbar, picker, palette, and inspector', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);

    const ref = createRef<AuroraEditorRef>();
    const root = createRoot(container);

    await act(async () => {
      root.render(
        <AuroraEditor
          ref={ref}
          document={testDoc}
          mode="standard"
          enableAuthoringFeatures={true}
        />
      );
    });

    expect(ref.current).not.toBeNull();
    const doc = ref.current?.getDocument();
    expect(doc?.format).toBe('aurora');
    expect(doc?.content[0].content?.[0].text).toBe('React HTML Authoring');

    // Verify toolbar buttons rendered
    const toolbarButtons = container.querySelectorAll('.aurora-tb-btn');
    expect(toolbarButtons.length).toBeGreaterThan(0);

    root.unmount();
    container.remove();
  });

  it('provides full HTML element registry, reactive context, palette, and inspector through hooks', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);

    let captured: any = null;
    const root = createRoot(container);

    await act(async () => {
      root.render(
        <AuroraProvider editor={null} mode="advanced">
          <TestConsumer onReady={(data) => { captured = data; }} />
        </AuroraProvider>
      );
    });

    expect(captured).not.toBeNull();
    expect(captured.registry.getAll().length).toBeGreaterThanOrEqual(40);
    expect(captured.context.editorMode).toBe('advanced');
    expect(captured.palette.isOpen).toBe(false);
    expect(captured.inspector.isOpen).toBe(false);

    // Test a11y inspection via inspector hook
    const img = document.createElement('img');
    img.src = 'https://example.com/test.png';
    const auditData = captured.inspector.inspect(img);
    expect(auditData.tagName).toBe('img');
    expect(auditData.accessibilityIssues.length).toBeGreaterThan(0);

    // Test auto-fix
    const fixed = captured.inspector.applyFix(auditData.accessibilityIssues[0]);
    expect(fixed).toBe(true);
    expect(img.hasAttribute('alt')).toBe(true);

    root.unmount();
    container.remove();
  });
});
