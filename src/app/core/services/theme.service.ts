// src/app/core/services/theme.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export type ThemeMode = 'light' | 'dark';
export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  success: string;
  warning: string;
  error: string;
  info: string;
  background: string;
  surface: string;
  text: string;
}

const LIGHT_THEME: ThemeColors = {
  primary: '#3f51b5', // Indigo
  secondary: '#673ab7', // Deep Purple
  accent: '#ff4081', // Pink
  success: '#4caf50', // Green
  warning: '#ff9800', // Orange
  error: '#f44336', // Red
  info: '#2196f3', // Blue
  background: '#f5f5f5', // Light Gray
  surface: '#ffffff', // White
  text: '#212121', // Dark Gray
};

const DARK_THEME: ThemeColors = {
  primary: '#5c6bc0', // Lighter Indigo
  secondary: '#7e57c2', // Lighter Deep Purple
  accent: '#ff4081', // Pink
  success: '#66bb6a', // Lighter Green
  warning: '#ffa726', // Lighter Orange
  error: '#ef5350', // Lighter Red
  info: '#42a5f5', // Lighter Blue
  background: '#303030', // Dark Gray
  surface: '#424242', // Medium Gray
  text: '#ffffff', // White
};

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private themeMode = new BehaviorSubject<ThemeMode>('light');
  private cssVarPrefix = '--app-';

  constructor() {
    // Check for saved theme preference
    const savedTheme = localStorage.getItem('themeMode') as ThemeMode;
    if (savedTheme) {
      this.setTheme(savedTheme);
    } else {
      // Check for system preference
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        this.setTheme('dark');
      }
    }

    // Listen for changes in system preference
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
      this.setTheme(e.matches ? 'dark' : 'light');
    });

    // Apply initial theme
    this.applyTheme();
  }

  getThemeMode(): Observable<ThemeMode> {
    return this.themeMode.asObservable();
  }

  getCurrentThemeColors(): ThemeColors {
    return this.themeMode.value === 'light' ? LIGHT_THEME : DARK_THEME;
  }

  setTheme(mode: ThemeMode): void {
    this.themeMode.next(mode);
    localStorage.setItem('themeMode', mode);
    this.applyTheme();
  }

  toggleTheme(): void {
    const newMode = this.themeMode.value === 'light' ? 'dark' : 'light';
    this.setTheme(newMode);
  }

  private applyTheme(): void {
    const colors = this.getCurrentThemeColors();
    const root = document.documentElement;

    // Set CSS variables
    Object.entries(colors).forEach(([name, value]) => {
      root.style.setProperty(`${this.cssVarPrefix}${name}`, value);
    });

    // Add or remove dark class on body
    if (this.themeMode.value === 'dark') {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }
  }
}