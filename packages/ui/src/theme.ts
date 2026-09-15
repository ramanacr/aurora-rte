export interface ThemeTokens {
  bg: string;
  fg: string;
  mutedBg: string;
  mutedFg: string;
  border: string;
  primary: string;
  primaryHover: string;
  primaryFg?: string;
  accent: string;
  secondary?: string;
  focusRing: string;
  radius: string;
  fontFamily: string;
  fontSize: string;
  btnHover?: string;
  btnActive?: string;
  selectionBg?: string;
  selectionFg?: string;
  additionBg?: string;
  additionFg?: string;
  deletionBg?: string;
  deletionFg?: string;
  tableBorder?: string;
  tableHeaderBg?: string;
  resizeHandle?: string;
}

export type ThemePresetName =
  | 'aurora-dark'
  | 'aurora-light'
  | 'shadcn-dark'
  | 'shadcn-light'
  | 'linear-dark'
  | 'enterprise-slate'
  | 'material-dark'
  | 'material-light'
  | 'high-contrast'
  | 'auto';

export const AURORA_BRAND_THEME: ThemeTokens = {
  bg: '#061535',
  fg: '#F7F9FF',
  mutedBg: '#0b204c',
  mutedFg: '#9eb1db',
  border: '#1a3366',
  primary: '#28E6F5',
  primaryHover: '#25E0C4',
  primaryFg: '#061535',
  accent: '#7549FF',
  secondary: '#25E0C4',
  focusRing: '#28E6F5',
  radius: '6px',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  fontSize: '14px',
  btnHover: '#102d68',
  btnActive: '#163b87',
  selectionBg: 'rgba(40, 230, 245, 0.25)',
  selectionFg: '#ffffff',
  additionBg: 'rgba(37, 224, 196, 0.15)',
  additionFg: '#25E0C4',
  deletionBg: 'rgba(255, 107, 107, 0.15)',
  deletionFg: '#ff6b6b',
  tableBorder: '#1a3366',
  tableHeaderBg: '#091c42',
  resizeHandle: '#28E6F5'
};

export const LIGHT_THEME: ThemeTokens = {
  bg: '#ffffff',
  fg: '#1e293b',
  mutedBg: '#f1f5f9',
  mutedFg: '#64748b',
  border: '#cbd5e1',
  primary: '#0284c7',
  primaryHover: '#0369a1',
  primaryFg: '#ffffff',
  accent: '#6366f1',
  secondary: '#0ea5e9',
  focusRing: '#38bdf8',
  radius: '6px',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  fontSize: '14px',
  btnHover: '#e2e8f0',
  btnActive: '#cbd5e1',
  selectionBg: 'rgba(2, 132, 199, 0.18)',
  selectionFg: '#0f172a',
  additionBg: '#dcfce7',
  additionFg: '#15803d',
  deletionBg: '#fee2e2',
  deletionFg: '#b91c1c',
  tableBorder: '#e2e8f0',
  tableHeaderBg: '#f8fafc',
  resizeHandle: '#0284c7'
};

export const SHADCN_DARK_THEME: ThemeTokens = {
  bg: '#09090b',
  fg: '#f4f4f5',
  mutedBg: '#18181b',
  mutedFg: '#a1a1aa',
  border: '#27272a',
  primary: '#fafafa',
  primaryHover: '#e4e4e7',
  primaryFg: '#18181b',
  accent: '#a1a1aa',
  secondary: '#27272a',
  focusRing: '#d4d4d8',
  radius: '6px',
  fontFamily: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  fontSize: '14px',
  btnHover: '#27272a',
  btnActive: '#3f3f46',
  selectionBg: 'rgba(250, 250, 250, 0.2)',
  selectionFg: '#ffffff',
  additionBg: 'rgba(34, 197, 94, 0.15)',
  additionFg: '#4ade80',
  deletionBg: 'rgba(239, 68, 68, 0.15)',
  deletionFg: '#f87171',
  tableBorder: '#27272a',
  tableHeaderBg: '#121215',
  resizeHandle: '#3b82f6'
};

export const SHADCN_LIGHT_THEME: ThemeTokens = {
  bg: '#ffffff',
  fg: '#09090b',
  mutedBg: '#f4f4f5',
  mutedFg: '#71717a',
  border: '#e4e4e7',
  primary: '#18181b',
  primaryHover: '#27272a',
  primaryFg: '#fafafa',
  accent: '#71717a',
  secondary: '#f4f4f5',
  focusRing: '#18181b',
  radius: '6px',
  fontFamily: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  fontSize: '14px',
  btnHover: '#f4f4f5',
  btnActive: '#e4e4e7',
  selectionBg: 'rgba(24, 24, 27, 0.12)',
  selectionFg: '#09090b',
  additionBg: '#dcfce7',
  additionFg: '#166534',
  deletionBg: '#fee2e2',
  deletionFg: '#991b1b',
  tableBorder: '#e4e4e7',
  tableHeaderBg: '#fafafa',
  resizeHandle: '#0ea5e9'
};

export const LINEAR_DARK_THEME: ThemeTokens = {
  bg: '#131415',
  fg: '#f7f8f8',
  mutedBg: '#1c1d1f',
  mutedFg: '#8a8f98',
  border: '#26282c',
  primary: '#5e6ad2',
  primaryHover: '#6875e2',
  primaryFg: '#ffffff',
  accent: '#7170ff',
  secondary: '#5e6ad2',
  focusRing: '#5e6ad2',
  radius: '8px',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  fontSize: '14px',
  btnHover: '#222326',
  btnActive: '#2e3035',
  selectionBg: 'rgba(94, 106, 210, 0.3)',
  selectionFg: '#ffffff',
  additionBg: 'rgba(38, 181, 98, 0.15)',
  additionFg: '#26b562',
  deletionBg: 'rgba(235, 87, 87, 0.15)',
  deletionFg: '#eb5757',
  tableBorder: '#26282c',
  tableHeaderBg: '#191a1c',
  resizeHandle: '#5e6ad2'
};

export const ENTERPRISE_SLATE_THEME: ThemeTokens = {
  bg: '#ffffff',
  fg: '#172b4d',
  mutedBg: '#f4f5f7',
  mutedFg: '#6b778c',
  border: '#dfe1e6',
  primary: '#0052cc',
  primaryHover: '#0065ff',
  primaryFg: '#ffffff',
  accent: '#4c9aff',
  secondary: '#0052cc',
  focusRing: '#4c9aff',
  radius: '4px',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  fontSize: '14px',
  btnHover: '#ebecf0',
  btnActive: '#dfe1e6',
  selectionBg: 'rgba(0, 82, 204, 0.18)',
  selectionFg: '#172b4d',
  additionBg: '#e3fcef',
  additionFg: '#006644',
  deletionBg: '#ffebe6',
  deletionFg: '#bf2600',
  tableBorder: '#dfe1e6',
  tableHeaderBg: '#f4f5f7',
  resizeHandle: '#0052cc'
};

export const MATERIAL_DARK_THEME: ThemeTokens = {
  bg: '#141218',
  fg: '#e6e0e9',
  mutedBg: '#1d1b20',
  mutedFg: '#938f99',
  border: '#49454f',
  primary: '#d0bcff',
  primaryHover: '#e8def8',
  primaryFg: '#381e72',
  accent: '#ccc2dc',
  secondary: '#d0bcff',
  focusRing: '#d0bcff',
  radius: '12px',
  fontFamily: 'Roboto, -apple-system, BlinkMacSystemFont, sans-serif',
  fontSize: '14px',
  btnHover: '#2b2930',
  btnActive: '#36343b',
  selectionBg: 'rgba(208, 188, 255, 0.25)',
  selectionFg: '#ffffff',
  additionBg: 'rgba(186, 252, 178, 0.15)',
  additionFg: '#bafcb2',
  deletionBg: 'rgba(255, 179, 174, 0.15)',
  deletionFg: '#ffb3ae',
  tableBorder: '#49454f',
  tableHeaderBg: '#211f26',
  resizeHandle: '#d0bcff'
};

export const MATERIAL_LIGHT_THEME: ThemeTokens = {
  bg: '#fef7ff',
  fg: '#1d1b20',
  mutedBg: '#f3edf7',
  mutedFg: '#79747e',
  border: '#cac4d0',
  primary: '#6750a4',
  primaryHover: '#7e67be',
  primaryFg: '#ffffff',
  accent: '#625b71',
  secondary: '#6750a4',
  focusRing: '#6750a4',
  radius: '12px',
  fontFamily: 'Roboto, -apple-system, BlinkMacSystemFont, sans-serif',
  fontSize: '14px',
  btnHover: '#e8def8',
  btnActive: '#ded8e1',
  selectionBg: 'rgba(103, 80, 164, 0.16)',
  selectionFg: '#1d1b20',
  additionBg: '#dcfce7',
  additionFg: '#15803d',
  deletionBg: '#fee2e2',
  deletionFg: '#b91c1c',
  tableBorder: '#cac4d0',
  tableHeaderBg: '#f7f2fa',
  resizeHandle: '#6750a4'
};

export const HIGH_CONTRAST_THEME: ThemeTokens = {
  bg: '#000000',
  fg: '#ffffff',
  mutedBg: '#1a1a1a',
  mutedFg: '#e0e0e0',
  border: '#ffffff',
  primary: '#ffff00',
  primaryHover: '#ffff66',
  primaryFg: '#000000',
  accent: '#00ffff',
  secondary: '#ffff00',
  focusRing: '#ffff00',
  radius: '0px',
  fontFamily: 'monospace, sans-serif',
  fontSize: '15px',
  btnHover: '#333333',
  btnActive: '#4d4d4d',
  selectionBg: '#ffff00',
  selectionFg: '#000000',
  additionBg: 'rgba(0, 255, 0, 0.2)',
  additionFg: '#00ff00',
  deletionBg: 'rgba(255, 0, 0, 0.2)',
  deletionFg: '#ff3333',
  tableBorder: '#ffffff',
  tableHeaderBg: '#222222',
  resizeHandle: '#ffff00'
};

export const THEME_PRESETS: Record<string, ThemeTokens> = {
  'aurora-dark': AURORA_BRAND_THEME,
  'aurora-brand': AURORA_BRAND_THEME,
  'aurora-light': LIGHT_THEME,
  'light': LIGHT_THEME,
  'dark': AURORA_BRAND_THEME,
  'shadcn-dark': SHADCN_DARK_THEME,
  'shadcn-light': SHADCN_LIGHT_THEME,
  'linear-dark': LINEAR_DARK_THEME,
  'enterprise-slate': ENTERPRISE_SLATE_THEME,
  'material-dark': MATERIAL_DARK_THEME,
  'material-light': MATERIAL_LIGHT_THEME,
  'high-contrast': HIGH_CONTRAST_THEME
};

/**
 * Checks if a given RGB/Hex color is dark based on relative luminance.
 */
export function isDarkColor(colorStr: string): boolean {
  if (!colorStr) return true;
  let r = 0, g = 0, b = 0;

  if (colorStr.startsWith('#')) {
    const hex = colorStr.replace('#', '');
    if (hex.length === 3) {
      r = parseInt(hex[0] + hex[0], 16);
      g = parseInt(hex[1] + hex[1], 16);
      b = parseInt(hex[2] + hex[2], 16);
    } else if (hex.length >= 6) {
      r = parseInt(hex.substring(0, 2), 16);
      g = parseInt(hex.substring(2, 4), 16);
      b = parseInt(hex.substring(4, 6), 16);
    }
  } else if (colorStr.startsWith('rgb')) {
    const parts = colorStr.match(/\d+/g);
    if (parts && parts.length >= 3) {
      r = parseInt(parts[0], 10);
      g = parseInt(parts[1], 10);
      b = parseInt(parts[2], 10);
    }
  }

  const luminance = (0.299 * r + 0.587 * g + 0.114 * b);
  return luminance < 140;
}

/**
 * Auto-detects CSS variables and styles from host environment (Tailwind/Shadcn/Radix/Material).
 */
export function autoDetectHostTheme(container?: HTMLElement | null): { isDark: boolean; tokens: Partial<ThemeTokens> } {
  const detected: Partial<ThemeTokens> = {};
  let isDark = false;

  if (typeof document === 'undefined') {
    return { isDark: true, tokens: AURORA_BRAND_THEME };
  }

  const target = container || document.body || document.documentElement;
  const computed = window.getComputedStyle(target);
  const rootComputed = window.getComputedStyle(document.documentElement);

  // Helper to read CSS variable
  const getVar = (name: string): string => {
    return (
      target.style.getPropertyValue(name).trim() ||
      computed.getPropertyValue(name).trim() ||
      rootComputed.getPropertyValue(name).trim() ||
      ''
    );
  };

  // 1. Detect dark mode from classes or data attributes
  const hasDarkOnEl = (el: HTMLElement | null): boolean => {
    if (!el) return false;
    return (
      el.classList.contains('dark') ||
      el.getAttribute('data-theme') === 'dark' ||
      el.getAttribute('data-mode') === 'dark'
    );
  };

  const isDarkClass =
    hasDarkOnEl(target) ||
    (target.closest ? hasDarkOnEl(target.closest('.dark, [data-theme="dark"], [data-mode="dark"]')) : false) ||
    hasDarkOnEl(document.body) ||
    hasDarkOnEl(document.documentElement);

  const systemPrefersDark =
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-color-scheme: dark)').matches;

  // 2. Read Tailwind / Shadcn / Radix variables
  const hostBg = getVar('--background') || computed.backgroundColor;
  const hostFg = getVar('--foreground') || computed.color;
  const hostPrimary = getVar('--primary');
  const hostPrimaryFg = getVar('--primary-foreground');
  const hostMuted = getVar('--muted');
  const hostMutedFg = getVar('--muted-foreground');
  const hostBorder = getVar('--border');
  const hostRadius = getVar('--radius');
  const hostFont = getVar('--font-sans') || computed.fontFamily;

  if (hostBg && hostBg !== 'rgba(0, 0, 0, 0)' && hostBg !== 'transparent') {
    isDark = isDarkColor(hostBg);
    detected.bg = hostBg;
  } else {
    isDark = isDarkClass || systemPrefersDark;
  }

  if (hostFg) detected.fg = hostFg;
  if (hostPrimary) detected.primary = hostPrimary;
  if (hostPrimaryFg) detected.primaryFg = hostPrimaryFg;
  if (hostMuted) detected.mutedBg = hostMuted;
  if (hostMutedFg) detected.mutedFg = hostMutedFg;
  if (hostBorder) detected.border = hostBorder;
  if (hostRadius) detected.radius = hostRadius;
  if (hostFont) detected.fontFamily = hostFont;

  return { isDark, tokens: detected };
}

export interface ThemeManagerOptions {
  target?: HTMLElement | null;
  theme?: string;
  tokens?: Partial<ThemeTokens>;
  autoInherit?: boolean;
  onThemeChange?: (themeName: string, tokens: ThemeTokens) => void;
}

export interface ThemeManager {
  setTheme(themeName: string): void;
  setTokens(tokens: Partial<ThemeTokens>): void;
  setAutoInherit(enabled: boolean): void;
  getTheme(): string;
  getTokens(): ThemeTokens;
  isDark(): boolean;
  apply(): void;
  destroy(): void;
}

export function createThemeManager(options: ThemeManagerOptions = {}): ThemeManager {
  let currentThemeName = options.theme || 'auto';
  let customTokens = options.tokens || {};
  let autoInherit = options.autoInherit ?? (currentThemeName === 'auto');
  let currentTokens: ThemeTokens = { ...AURORA_BRAND_THEME };
  let observer: MutationObserver | null = null;
  let mediaQuery: MediaQueryList | null = null;
  let mediaListener: (() => void) | null = null;

  const targetEl = options.target || (typeof document !== 'undefined' ? document.body : null);

  const resolveTokens = (): ThemeTokens => {
    let baseTheme: ThemeTokens;

    if (autoInherit || currentThemeName === 'auto') {
      const host = autoDetectHostTheme(targetEl);
      const defaultBase = host.isDark ? SHADCN_DARK_THEME : SHADCN_LIGHT_THEME;
      baseTheme = { ...defaultBase, ...host.tokens };
    } else {
      baseTheme = THEME_PRESETS[currentThemeName] || AURORA_BRAND_THEME;
    }

    return { ...baseTheme, ...customTokens };
  };

  const apply = (): void => {
    currentTokens = resolveTokens();
    if (targetEl) {
      applyTheme(targetEl, currentTokens);
    }
    if (options.onThemeChange) {
      options.onThemeChange(currentThemeName, currentTokens);
    }
  };

  const setupObservers = (): void => {
    if (typeof document === 'undefined') return;

    if (typeof MutationObserver !== 'undefined') {
      observer = new MutationObserver(() => {
        if (autoInherit || currentThemeName === 'auto') {
          apply();
        }
      });

      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['class', 'data-theme', 'data-mode', 'style']
      });

      if (document.body) {
        observer.observe(document.body, {
          attributes: true,
          attributeFilter: ['class', 'data-theme', 'data-mode', 'style']
        });
      }
    }

    if (typeof window !== 'undefined' && window.matchMedia) {
      mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaListener = () => {
        if (autoInherit || currentThemeName === 'auto') {
          apply();
        }
      };
      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', mediaListener);
      } else if ((mediaQuery as any).addListener) {
        (mediaQuery as any).addListener(mediaListener);
      }
    }
  };

  setupObservers();
  apply();

  return {
    setTheme(name: string) {
      currentThemeName = name;
      autoInherit = name === 'auto';
      apply();
    },
    setTokens(tokens: Partial<ThemeTokens>) {
      customTokens = { ...customTokens, ...tokens };
      apply();
    },
    setAutoInherit(enabled: boolean) {
      autoInherit = enabled;
      apply();
    },
    getTheme() {
      return currentThemeName;
    },
    getTokens() {
      return currentTokens;
    },
    isDark() {
      return isDarkColor(currentTokens.bg);
    },
    apply,
    destroy() {
      if (observer) {
        observer.disconnect();
        observer = null;
      }
      if (mediaQuery && mediaListener) {
        if (mediaQuery.removeEventListener) {
          mediaQuery.removeEventListener('change', mediaListener);
        } else if ((mediaQuery as any).removeListener) {
          (mediaQuery as any).removeListener(mediaListener);
        }
        mediaQuery = null;
        mediaListener = null;
      }
    }
  };
}

export function applyTheme(element: HTMLElement, tokens: Partial<ThemeTokens> = AURORA_BRAND_THEME): void {
  const merged = { ...AURORA_BRAND_THEME, ...tokens };
  const targetElements: HTMLElement[] = [element];

  if (typeof document !== 'undefined') {
    if (
      element === document.body ||
      element === document.documentElement ||
      element.id === 'app' ||
      element.classList.contains('aurora-playground-container')
    ) {
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
    if (merged.primaryFg) el.style.setProperty('--aurora-primary-fg', merged.primaryFg);
    el.style.setProperty('--aurora-accent', merged.accent);
    if (merged.secondary) el.style.setProperty('--aurora-secondary', merged.secondary);
    el.style.setProperty('--aurora-focus-ring', merged.focusRing);
    el.style.setProperty('--aurora-radius', merged.radius);
    el.style.setProperty('--aurora-font-family', merged.fontFamily);
    el.style.setProperty('--aurora-font-size', merged.fontSize);
    if (merged.btnHover) el.style.setProperty('--aurora-btn-hover', merged.btnHover);
    if (merged.btnActive) el.style.setProperty('--aurora-btn-active', merged.btnActive);
    if (merged.selectionBg) el.style.setProperty('--aurora-selection-bg', merged.selectionBg);
    if (merged.selectionFg) el.style.setProperty('--aurora-selection-fg', merged.selectionFg);
    if (merged.additionBg) el.style.setProperty('--aurora-addition-bg', merged.additionBg);
    if (merged.additionFg) el.style.setProperty('--aurora-addition-fg', merged.additionFg);
    if (merged.deletionBg) el.style.setProperty('--aurora-deletion-bg', merged.deletionBg);
    if (merged.deletionFg) el.style.setProperty('--aurora-deletion-fg', merged.deletionFg);
    if (merged.tableBorder) el.style.setProperty('--aurora-table-border', merged.tableBorder);
    if (merged.tableHeaderBg) el.style.setProperty('--aurora-table-header-bg', merged.tableHeaderBg);
    if (merged.resizeHandle) el.style.setProperty('--aurora-resize-handle', merged.resizeHandle);
  });
}

