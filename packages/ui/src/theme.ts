export interface ThemeTokens {
  bg: string;
  fg: string;
  mutedBg: string;
  mutedFg: string;
  border: string;
  primary: string;
  primaryHover: string;
  accent: string;
  focusRing: string;
  radius: string;
  fontFamily: string;
  fontSize: string;
}

export const AURORA_BRAND_THEME: ThemeTokens = {
  bg: '#061535',
  fg: '#F7F9FF',
  mutedBg: '#0b204c',
  mutedFg: '#9eb1db',
  border: '#1a3366',
  primary: '#28E6F5',
  primaryHover: '#25E0C4',
  accent: '#7549FF',
  focusRing: '#28E6F5',
  radius: '6px',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  fontSize: '14px'
};

export const LIGHT_THEME: ThemeTokens = {
  bg: '#ffffff',
  fg: '#1e293b',
  mutedBg: '#f1f5f9',
  mutedFg: '#64748b',
  border: '#cbd5e1',
  primary: '#0284c7',
  primaryHover: '#0369a1',
  accent: '#6366f1',
  focusRing: '#38bdf8',
  radius: '6px',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  fontSize: '14px'
};

export const HIGH_CONTRAST_THEME: ThemeTokens = {
  bg: '#000000',
  fg: '#ffffff',
  mutedBg: '#1a1a1a',
  mutedFg: '#e0e0e0',
  border: '#ffffff',
  primary: '#ffff00',
  primaryHover: '#ffff66',
  accent: '#00ffff',
  focusRing: '#ffff00',
  radius: '0px',
  fontFamily: 'monospace, sans-serif',
  fontSize: '15px'
};

export function applyTheme(element: HTMLElement, tokens: Partial<ThemeTokens> = AURORA_BRAND_THEME): void {
  const merged = { ...AURORA_BRAND_THEME, ...tokens };
  const targetElements: HTMLElement[] = [element];

  if (typeof document !== 'undefined') {
    if (element === document.body || element === document.documentElement || element.id === 'app' || element.classList.contains('aurora-playground-container')) {
      targetElements.push(document.body, document.documentElement);
    }
  }

  targetElements.forEach((el) => {
    if (!el || !el.style) return;
    el.style.setProperty('--aurora-bg', merged.bg);
    el.style.setProperty('--aurora-fg', merged.fg);
    el.style.setProperty('--aurora-muted-bg', merged.mutedBg);
    el.style.setProperty('--aurora-muted-fg', merged.mutedFg);
    el.style.setProperty('--aurora-border', merged.border);
    el.style.setProperty('--aurora-primary', merged.primary);
    el.style.setProperty('--aurora-primary-hover', merged.primaryHover);
    el.style.setProperty('--aurora-accent', merged.accent);
    el.style.setProperty('--aurora-focus-ring', merged.focusRing);
    el.style.setProperty('--aurora-radius', merged.radius);
    el.style.setProperty('--aurora-font-family', merged.fontFamily);
    el.style.setProperty('--aurora-font-size', merged.fontSize);
  });
}
