import React, { createContext, useContext, useEffect, useMemo, useState, useRef } from 'react';
import {
  type ThemeTokens,
  type ThemePresetName,
  type ThemeManager,
  createThemeManager,
  THEME_PRESETS
} from '@aurora/ui';

export interface AuroraThemeContextValue {
  theme: string;
  setTheme: (theme: string) => void;
  tokens: ThemeTokens;
  setTokens: (tokens: Partial<ThemeTokens>) => void;
  isDark: boolean;
  autoInherit: boolean;
  setAutoInherit: (enabled: boolean) => void;
  manager: ThemeManager | null;
}

const AuroraThemeContext = createContext<AuroraThemeContextValue | null>(null);

export interface AuroraThemeProviderProps {
  theme?: ThemePresetName | string;
  tokens?: Partial<ThemeTokens>;
  autoInherit?: boolean;
  target?: HTMLElement | null;
  children: React.ReactNode;
}

export function AuroraThemeProvider({
  theme = 'auto',
  tokens = {},
  autoInherit = true,
  target,
  children
}: AuroraThemeProviderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentTheme, setCurrentTheme] = useState<string>(theme);
  const [currentTokens, setCurrentTokens] = useState<ThemeTokens>(() => {
    const base = THEME_PRESETS[theme] || THEME_PRESETS['aurora-dark'];
    return { ...base, ...tokens } as ThemeTokens;
  });
  const [isDark, setIsDark] = useState<boolean>(() => {
    const base = THEME_PRESETS[theme] || THEME_PRESETS['aurora-dark'];
    const merged = { ...base, ...tokens };
    return (merged.bg ? !merged.bg.includes('255') && merged.bg !== '#ffffff' : true);
  });
  const [inherit, setInherit] = useState<boolean>(autoInherit);

  const managerRef = useRef<ThemeManager | null>(null);

  useEffect(() => {
    const targetEl = target || containerRef.current || (typeof document !== 'undefined' ? document.body : null);
    const manager = createThemeManager({
      target: targetEl,
      theme: currentTheme,
      tokens,
      autoInherit: inherit,
      onThemeChange: (newTheme, newTokens) => {
        setCurrentTheme(newTheme);
        setCurrentTokens({ ...newTokens });
        setIsDark(manager.isDark());
      }
    });

    managerRef.current = manager;
    setCurrentTokens({ ...manager.getTokens() });
    setIsDark(manager.isDark());

    return () => {
      manager.destroy();
      managerRef.current = null;
    };
  }, [target, inherit]);

  const value = useMemo<AuroraThemeContextValue>(() => ({
    theme: currentTheme,
    setTheme: (newTheme: string) => {
      setCurrentTheme(newTheme);
      managerRef.current?.setTheme(newTheme);
    },
    tokens: currentTokens,
    setTokens: (newTokens: Partial<ThemeTokens>) => {
      managerRef.current?.setTokens(newTokens);
      if (managerRef.current) {
        setCurrentTokens({ ...managerRef.current.getTokens() });
      }
    },
    isDark,
    autoInherit: inherit,
    setAutoInherit: (enabled: boolean) => {
      setInherit(enabled);
      managerRef.current?.setAutoInherit(enabled);
    },
    manager: managerRef.current
  }), [currentTheme, currentTokens, isDark, inherit]);

  return (
    <AuroraThemeContext.Provider value={value}>
      <div ref={containerRef} className="aurora-theme-root" style={{ display: 'contents' }}>
        {children}
      </div>
    </AuroraThemeContext.Provider>
  );
}

export function useAuroraTheme(): AuroraThemeContextValue {
  const ctx = useContext(AuroraThemeContext);
  if (!ctx) {
    // Return a standalone fallback instance if not within a provider
    return {
      theme: 'auto',
      setTheme: () => {},
      tokens: THEME_PRESETS['aurora-dark'],
      setTokens: () => {},
      isDark: true,
      autoInherit: true,
      setAutoInherit: () => {},
      manager: null
    };
  }
  return ctx;
}
