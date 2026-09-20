import { useRef } from 'react';
import {
  AuroraEditor,
  type AuroraEditorRef
} from '@aurora/react';
import type { AuroraDocument } from '@aurora/model';

const reactInitialDoc: AuroraDocument = {
  format: 'aurora',
  version: 1,
  content: [
    {
      type: 'heading',
      attrs: { level: 1 },
      content: [{ type: 'text', text: '⚛️ React 19 Aurora Editor Integration' }]
    },
    {
      type: 'paragraph',
      content: [
        { type: 'text', text: 'This tab demonstrates the full ' },
        { type: 'text', text: '@aurora/react', marks: [{ type: 'bold' }] },
        {
          type: 'text',
          text: ' component ecosystem, featuring the reactive Toolbar, Command Palette (Ctrl+K), WCAG Accessibility Inspector, and HTML Element Scaffolds.'
        }
      ]
    },
    {
      type: 'image',
      attrs: {
        src: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=700&auto=format&fit=crop&q=80',
        alt: 'React Code on Display Screen',
        title: 'React 19 Editor'
      }
    },
    {
      type: 'paragraph',
      content: [
        {
          type: 'text',
          text: 'Use the quick buttons above or press Ctrl+K to open the Command Palette to scaffold composite elements like <details>, <figure>, and tables directly into this document.'
        }
      ]
    }
  ]
};

export function ReactEditorApp() {
  const editorRef = useRef<AuroraEditorRef | null>(null);

  const insertScaffold = (type: string) => {
    const editor = editorRef.current;
    if (!editor) return;

    if (type === 'figure') {
      editor.execute('insertHtml', {
        html: '<figure><img src="https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=600" alt="Scenic Gradient Visual" /><figcaption>Figure 1.1: Aurora color spectrum</figcaption></figure>'
      });
    } else if (type === 'details') {
      editor.execute('insertHtml', {
        html: '<details><summary>Click to Expand Technical Specifications</summary><p>Detailed technical specifications and parameters are displayed here.</p></details>'
      });
    } else if (type === 'table') {
      editor.execute('insertTable', { rows: 3, columns: 3, header: true });
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        background: 'var(--aurora-bg, #040d21)',
        padding: '16px',
        borderRadius: '8px',
        border: '1px solid var(--aurora-border, #132a59)'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--aurora-border, #132a59)', paddingBottom: '10px' }}>
        <div>
          <h3 style={{ margin: 0, color: 'var(--aurora-primary, #00F0FF)', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>⚛️</span> React 19 Native Integration
          </h3>
          <p style={{ margin: '3px 0 0 0', fontSize: '0.82rem', color: 'var(--aurora-muted-fg, #8ca0c2)' }}>
            Full reactive architecture with AuroraProvider, useRteContext, useHtmlRegistry, and integrated Inspector.
          </p>
        </div>
        <span style={{ fontSize: '0.75rem', padding: '4px 8px', borderRadius: '4px', background: 'rgba(0,240,255,0.1)', color: 'var(--aurora-primary, #00F0FF)', border: '1px solid rgba(0,240,255,0.3)' }}>
          React v19.3.0
        </span>
      </div>

      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
        <button
          onClick={() => insertScaffold('figure')}
          style={{
            padding: '6px 10px',
            fontSize: '0.8rem',
            background: 'var(--aurora-muted-bg, rgba(255,255,255,0.05))',
            color: 'var(--aurora-fg, #f0f4f8)',
            border: '1px solid var(--aurora-border, #132a59)',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          + Figure Scaffold
        </button>

        <button
          onClick={() => insertScaffold('details')}
          style={{
            padding: '6px 10px',
            fontSize: '0.8rem',
            background: 'var(--aurora-muted-bg, rgba(255,255,255,0.05))',
            color: 'var(--aurora-fg, #f0f4f8)',
            border: '1px solid var(--aurora-border, #132a59)',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          + Details / Summary
        </button>

        <button
          onClick={() => insertScaffold('table')}
          style={{
            padding: '6px 10px',
            fontSize: '0.8rem',
            background: 'var(--aurora-muted-bg, rgba(255,255,255,0.05))',
            color: 'var(--aurora-fg, #f0f4f8)',
            border: '1px solid var(--aurora-border, #132a59)',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          + Responsive Table
        </button>
      </div>

      <AuroraEditor
        ref={editorRef}
        document={reactInitialDoc}
        enableAuthoringFeatures={true}
        toolbar={true}
        style={{
          minHeight: '400px',
          border: '1px solid var(--aurora-border, #132a59)',
          borderRadius: '6px',
          background: 'var(--aurora-bg, #020814)',
          color: 'var(--aurora-fg, #f0f4f8)',
          padding: '16px'
        }}
      />
    </div>
  );
}
