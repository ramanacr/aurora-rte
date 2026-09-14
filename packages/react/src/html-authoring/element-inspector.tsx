import { useAurora } from './context.js';

export function AuroraElementInspector() {
  const {
    isInspectorOpen,
    closeInspector,
    inspectorData,
    selectedElementForInspector,
    applyFix,
    inspect
  } = useAurora();

  if (!isInspectorOpen || !inspectorData) return null;

  const refresh = () => {
    if (selectedElementForInspector) {
      inspect(selectedElementForInspector);
    }
  };

  const updateId = (id: string) => {
    if (selectedElementForInspector) {
      selectedElementForInspector.id = id;
      refresh();
    }
  };

  const updateClasses = (classes: string) => {
    if (selectedElementForInspector) {
      selectedElementForInspector.className = classes;
      refresh();
    }
  };

  const updateAttribute = (name: string, value: string) => {
    if (selectedElementForInspector) {
      if (value) {
        selectedElementForInspector.setAttribute(name, value);
      } else {
        selectedElementForInspector.removeAttribute(name);
      }
      refresh();
    }
  };

  return (
    <div
      className="aurora-react-inspector-drawer"
      style={{
        position: 'fixed',
        top: '60px',
        right: 0,
        width: '320px',
        height: 'calc(100vh - 60px)',
        background: '#ffffff',
        borderLeft: '1px solid #cbd5e1',
        boxShadow: '-4px 0 16px rgba(0, 0, 0, 0.08)',
        zIndex: 100000,
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'inherit'
      }}
    >
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px',
        borderBottom: '1px solid #e2e8f0',
        background: '#f8fafc'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontFamily: 'monospace', fontSize: '11px', background: '#e0e7ff', color: '#4338ca', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>
            &lt;{inspectorData.tagName}&gt;
          </span>
          <h4 style={{ margin: 0, fontSize: '15px', color: '#0f172a' }}>Inspector</h4>
        </div>
        <button
          type="button"
          style={{ border: 'none', background: 'transparent', fontSize: '16px', cursor: 'pointer', color: '#64748b' }}
          onClick={closeInspector}
        >
          ✕
        </button>
      </div>

      <div style={{ flex: 1, padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Accessibility Audit */}
        <div>
          <h5 style={{ margin: '0 0 8px 0', fontSize: '12px', textTransform: 'uppercase', color: '#475569', letterSpacing: '0.05em' }}>
            Accessibility & Quality Audit
          </h5>
          {inspectorData.accessibilityIssues.length === 0 && (
            <div style={{ padding: '8px 12px', background: '#ecfdf5', color: '#047857', borderRadius: '6px', fontSize: '12px' }}>
              ✓ No accessibility issues detected!
            </div>
          )}
          {inspectorData.accessibilityIssues.map((issue, idx) => (
            <div
              key={idx}
              style={{
                padding: '10px',
                borderRadius: '6px',
                fontSize: '12px',
                marginBottom: '8px',
                background: issue.severity === 'error' ? '#fef2f2' : issue.severity === 'warning' ? '#fffbeb' : '#f0f9ff',
                borderLeft: `3px solid ${issue.severity === 'error' ? '#ef4444' : issue.severity === 'warning' ? '#f59e0b' : '#0284c7'}`,
                color: issue.severity === 'error' ? '#991b1b' : issue.severity === 'warning' ? '#92400e' : '#075985'
              }}
            >
              <div>
                <span style={{ textTransform: 'uppercase', fontWeight: 'bold', fontSize: '9px', marginRight: '6px' }}>
                  {issue.severity}
                </span>
                <span>{issue.message}</span>
              </div>
              {issue.fixLabel && (
                <button
                  type="button"
                  style={{
                    marginTop: '6px',
                    padding: '4px 8px',
                    border: '1px solid #cbd5e1',
                    background: 'white',
                    borderRadius: '4px',
                    fontSize: '11px',
                    cursor: 'pointer',
                    fontWeight: 600
                  }}
                  onClick={() => applyFix(issue)}
                >
                  🛠 {issue.fixLabel}
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Attributes */}
        <div>
          <h5 style={{ margin: '0 0 8px 0', fontSize: '12px', textTransform: 'uppercase', color: '#475569', letterSpacing: '0.05em' }}>
            Attributes
          </h5>
          <div style={{ display: 'flex', flexDirection: 'column', marginBottom: '10px' }}>
            <label style={{ fontSize: '11px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>ID:</label>
            <input
              type="text"
              value={inspectorData.id || ''}
              onChange={(e) => updateId(e.target.value)}
              placeholder="element-id"
              style={{ padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '12px' }}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', marginBottom: '10px' }}>
            <label style={{ fontSize: '11px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>Classes:</label>
            <input
              type="text"
              value={inspectorData.classes.join(' ')}
              onChange={(e) => updateClasses(e.target.value)}
              placeholder="class-1 class-2"
              style={{ padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '12px' }}
            />
          </div>

          {inspectorData.definition?.attributes?.map((attr) => (
            <div key={attr.name} style={{ display: 'flex', flexDirection: 'column', marginBottom: '10px' }}>
              <label style={{ fontSize: '11px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>{attr.name}:</label>
              <input
                type="text"
                value={inspectorData.attributes[attr.name] || ''}
                onChange={(e) => updateAttribute(attr.name, e.target.value)}
                placeholder={attr.description || attr.type}
                style={{ padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '12px' }}
              />
            </div>
          ))}
        </div>

        {/* Live HTML Snippet */}
        <div>
          <h5 style={{ margin: '0 0 8px 0', fontSize: '12px', textTransform: 'uppercase', color: '#475569', letterSpacing: '0.05em' }}>
            Live HTML Preview
          </h5>
          <pre style={{ background: '#0f172a', color: '#38bdf8', padding: '10px', borderRadius: '6px', fontSize: '11px', overflowX: 'auto', maxHeight: '140px' }}>
            <code>{inspectorData.htmlPreview}</code>
          </pre>
        </div>
      </div>
    </div>
  );
}
