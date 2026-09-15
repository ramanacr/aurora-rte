import { Injectable, OnDestroy, signal } from '@angular/core';
import {
  type ThemeTokens,
  type ThemePresetName,
  type ThemeManager,
  createThemeManager,
  THEME_PRESETS
} from '@aurora/ui';

@Injectable()
export class AuroraThemeService implements OnDestroy {
  private manager: ThemeManager | null = null;

  public currentTheme = signal<string>('auto');
  public currentTokens = signal<ThemeTokens>((THEME_PRESETS['aurora-dark'] || {}) as ThemeTokens);
  public isDark = signal<boolean>(true);

  public attach(
    element: HTMLElement,
    options: {
      theme?: ThemePresetName | string;
      tokens?: Partial<ThemeTokens>;
      autoInherit?: boolean;
    } = {}
  ): void {
    if (this.manager) {
      this.manager.destroy();
    }

    const initialTheme = options.theme || 'auto';
    this.currentTheme.set(initialTheme);

    this.manager = createThemeManager({
      target: element,
      theme: initialTheme,
      tokens: options.tokens,
      autoInherit: options.autoInherit ?? (initialTheme === 'auto'),
      onThemeChange: (themeName, tokens) => {
        this.currentTheme.set(themeName);
        this.currentTokens.set({ ...tokens });
        this.isDark.set(this.manager ? this.manager.isDark() : true);
      }
    });

    this.currentTokens.set(this.manager.getTokens());
    this.isDark.set(this.manager.isDark());
  }

  public setTheme(themeName: ThemePresetName | string): void {
    this.currentTheme.set(themeName);
    this.manager?.setTheme(themeName);
  }

  public setTokens(tokens: Partial<ThemeTokens>): void {
    this.manager?.setTokens(tokens);
    if (this.manager) {
      this.currentTokens.set(this.manager.getTokens());
    }
  }

  public setAutoInherit(enabled: boolean): void {
    this.manager?.setAutoInherit(enabled);
  }

  public getTokens(): ThemeTokens {
    return this.manager ? this.manager.getTokens() : this.currentTokens();
  }

  public ngOnDestroy(): void {
    if (this.manager) {
      this.manager.destroy();
      this.manager = null;
    }
  }
}
