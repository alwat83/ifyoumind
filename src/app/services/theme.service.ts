import { Injectable, Signal, signal } from '@angular/core';

type Theme = 'dark' | 'light';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private currentTheme = signal<Theme>('dark');

  constructor() {
    const saved = localStorage.getItem('app-theme') as Theme | null;
    if (saved === 'light' || saved === 'dark') {
      this.setTheme(saved);
    } else {
      // Prefer system
      const prefersLight = window.matchMedia(
        '(prefers-color-scheme: light)',
      ).matches;
      this.setTheme(prefersLight ? 'light' : 'dark');
    }
  }

  theme(): Signal<Theme> {
    return this.currentTheme;
  }

  toggle() {
    this.setTheme(this.currentTheme() === 'dark' ? 'light' : 'dark');
  }

  setTheme(theme: Theme) {
    this.currentTheme.set(theme);
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('app-theme', theme);
  }
}
