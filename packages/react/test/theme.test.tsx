import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import { AuroraThemeProvider, useAuroraTheme } from '../src/theme/theme-context.js';
import { THEME_PRESETS } from '@aurora/ui';

function TestConsumer() {
  const { theme, tokens, isDark } = useAuroraTheme();
  return (
    <div data-testid="theme-info" data-theme={theme} data-dark={isDark ? 'true' : 'false'}>
      {tokens.primary}
    </div>
  );
}

describe('React Aurora Theming', () => {
  it('provides theme context with active preset and tokens', () => {
    const html = renderToString(
      <AuroraThemeProvider theme="linear-dark">
        <TestConsumer />
      </AuroraThemeProvider>
    );

    expect(html).toContain('data-theme="linear-dark"');
    expect(html).toContain(THEME_PRESETS['linear-dark'].primary);
  });

  it('allows overriding specific tokens via props', () => {
    const html = renderToString(
      <AuroraThemeProvider theme="shadcn-dark" tokens={{ primary: '#10b981' }}>
        <TestConsumer />
      </AuroraThemeProvider>
    );

    expect(html).toContain('data-theme="shadcn-dark"');
    expect(html).toContain('#10b981');
  });
});
