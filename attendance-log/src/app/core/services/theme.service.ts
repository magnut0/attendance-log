import { Injectable, signal, effect } from '@angular/core';

const THEME_KEY = 'theme';
const DARK_CLASS = 'theme-dark';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly _isDark = signal<boolean>(false);

  readonly isDark = this._isDark.asReadonly();

  constructor() {
    const stored = localStorage.getItem(THEME_KEY);
    this._isDark.set(stored === 'dark');
    this.applyClass();

    effect(() => {
      localStorage.setItem(THEME_KEY, this._isDark() ? 'dark' : 'light');
      this.applyClass();
    });
  }

  toggle(): void {
    this._isDark.update((v) => !v);
  }

  private applyClass(): void {
    document.body.classList.toggle(DARK_CLASS, this._isDark());
  }
}
