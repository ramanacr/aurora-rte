import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  THEME_PRESETS,
  isDarkColor,
  autoDetectHostTheme,
  createThemeManager,
  applyTheme
} from '../src/theme.js';

describe('Aurora Theming Engine', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
  });

  describe('THEME_PRESETS', () => {
    it('provides all 9 enterprise SaaS presets with full token coverage', () => {
      const presets = [
        'aurora-dark',
        'aurora-light',
        'shadcn-dark',
        'shadcn-light',
        'linear-dark',
        'enterprise-slate',
        'material-dark',
        'material-light',
        'high-contrast'
      ] as const;

      for (const presetName of presets) {
        const tokens = THEME_PRESETS[presetName];
        expect(tokens).toBeDefined();
        expect(tokens.bg).toBeDefined();
        expect(tokens.fg).toBeDefined();
        expect(tokens.primary).toBeDefined();
        expect(tokens.mutedBg).toBeDefined();
        expect(tokens.tableBorder).toBeDefined();
        expect(tokens.fontFamily).toBeDefined();
      }
    });
  });

  describe('isDarkColor', () => {
    it('correctly identifies dark colors vs light colors', () => {
      expect(isDarkColor('#000000')).toBe(true);
      expect(isDarkColor('#0f172a')).toBe(true);
      expect(isDarkColor('#18181b')).toBe(true);
      expect(isDarkColor('#ffffff')).toBe(false);
      expect(isDarkColor('#f8fafc')).toBe(false);
      expect(isDarkColor('rgb(15, 23, 42)')).toBe(true);
      expect(isDarkColor('rgb(255, 255, 255)')).toBe(false);
    });
  });

  describe('autoDetectHostTheme', () => {
    it('detects shadcn/tailwind CSS variables when defined on root/ancestor', () => {
      container.style.setProperty('--background', '#ffffff');
      container.style.setProperty('--foreground', '#0f172a');
      container.style.setProperty('--primary', '#3b82f6');

      const detected = autoDetectHostTheme(container);
      expect(detected).toBeDefined();
      expect(detected.tokens.bg).toBe('#ffffff');
      expect(detected.tokens.fg).toBe('#0f172a');
      expect(detected.tokens.primary).toBe('#3b82f6');
    });

    it('falls back to system/class dark mode when no host CSS variables present', () => {
      container.classList.add('dark');
      const detected = autoDetectHostTheme(container);
      expect(detected.isDark).toBe(true);
    });
  });

  describe('createThemeManager', () => {
    it('creates theme manager and applies tokens to target element', () => {
      let notifiedTheme = '';
      const manager = createThemeManager({
        target: container,
        theme: 'shadcn-dark',
        onThemeChange: (t) => {
          notifiedTheme = t;
        }
      });

      expect(manager.getTheme()).toBe('shadcn-dark');
      expect(manager.isDark()).toBe(true);
      expect(container.style.getPropertyValue('--aurora-bg')).toBe(THEME_PRESETS['shadcn-dark'].bg);
      expect(container.style.getPropertyValue('--aurora-primary')).toBe(THEME_PRESETS['shadcn-dark'].primary);

      // Change preset
      manager.setTheme('linear-dark');
      expect(manager.getTheme()).toBe('linear-dark');
      expect(container.style.getPropertyValue('--aurora-primary')).toBe(THEME_PRESETS['linear-dark'].primary);
      expect(notifiedTheme).toBe('linear-dark');

      // Set custom overrides
      manager.setTokens({ primary: '#ec4899' });
      expect(container.style.getPropertyValue('--aurora-primary')).toBe('#ec4899');
      expect(manager.getTokens().primary).toBe('#ec4899');

      manager.destroy();
    });
  });

  describe('applyTheme', () => {
    it('writes all CSS variables to target element', () => {
      applyTheme(container, {
        bg: '#111111',
        fg: '#eeeeee',
        primary: '#3b82f6',
        radius: '8px'
      });

      expect(container.style.getPropertyValue('--aurora-bg')).toBe('#111111');
      expect(container.style.getPropertyValue('--aurora-fg')).toBe('#eeeeee');
      expect(container.style.getPropertyValue('--aurora-primary')).toBe('#3b82f6');
      expect(container.style.getPropertyValue('--aurora-radius')).toBe('8px');
    });
  });
});
