import type { UserPreferences } from './types.js';

const STORAGE_KEY = 'aurora_html_authoring_preferences';

const DEFAULT_PREFERENCES: UserPreferences = {
  favorites: ['p', 'h1', 'h2', 'table', 'img', 'a', 'ul', 'blockquote'],
  recentElements: ['p', 'h2', 'ul', 'img', 'table'],
  customPriorities: {}
};

/**
 * Manages user preferences, favorites, and recent usage history
 */
export class UserPreferencesManager {
  private prefs: UserPreferences;

  constructor() {
    this.prefs = this.load();
  }

  private load(): UserPreferences {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const stored = window.localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          return {
            favorites: parsed.favorites || DEFAULT_PREFERENCES.favorites,
            recentElements: parsed.recentElements || DEFAULT_PREFERENCES.recentElements,
            customPriorities: parsed.customPriorities || {}
          };
        }
      } catch {
        // Fallback on defaults if localStorage is inaccessible
      }
    }
    return { ...DEFAULT_PREFERENCES };
  }

  private save(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(this.prefs));
      } catch {
        // Ignore quota/access errors
      }
    }
  }

  getPreferences(): UserPreferences {
    return { ...this.prefs };
  }

  getFavorites(): string[] {
    return [...this.prefs.favorites];
  }

  getRecentElements(): string[] {
    return [...this.prefs.recentElements];
  }

  toggleFavorite(tagName: string): boolean {
    const tag = tagName.toLowerCase();
    const index = this.prefs.favorites.indexOf(tag);
    let isFav: boolean;
    if (index >= 0) {
      this.prefs.favorites.splice(index, 1);
      isFav = false;
    } else {
      this.prefs.favorites.push(tag);
      isFav = true;
    }
    this.save();
    return isFav;
  }

  recordUsage(tagName: string): void {
    const tag = tagName.toLowerCase();
    // Remove if already present, then prepend
    this.prefs.recentElements = [
      tag,
      ...this.prefs.recentElements.filter((t) => t !== tag)
    ].slice(0, 15); // keep max 15
    this.save();
  }

  setPriorityOverride(tagName: string, priority: number): void {
    this.prefs.customPriorities[tagName.toLowerCase()] = priority;
    this.save();
  }
}

let globalPreferencesManager: UserPreferencesManager | null = null;

export function getUserPreferencesManager(): UserPreferencesManager {
  if (!globalPreferencesManager) {
    globalPreferencesManager = new UserPreferencesManager();
  }
  return globalPreferencesManager;
}
