// src/app/core/services/theme.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type ThemeOption = 'slate-amber';
export type ModeOption = 'light' | 'dark';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private currentThemeSubject = new BehaviorSubject<ThemeOption>('slate-amber');
  private currentModeSubject = new BehaviorSubject<ModeOption>('light');
  
  public currentTheme$ = this.currentThemeSubject.asObservable();
  public currentMode$ = this.currentModeSubject.asObservable();
  
  constructor() {
    console.log('ThemeService constructor called');
    
    // Load saved theme from localStorage
    const savedTheme = localStorage.getItem('theme') as ThemeOption;
    if (savedTheme) {
      console.log(`Loading saved theme: ${savedTheme}`);
      this.setTheme(savedTheme);
    }
    
    // Load saved mode from localStorage
    const savedMode = localStorage.getItem('mode') as ModeOption;
    if (savedMode) {
      console.log(`Loading saved mode: ${savedMode}`);
      this.setMode(savedMode);
    } else {
      // Check for system preference if no saved mode
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      this.setMode(prefersDark ? 'dark' : 'light');
    }
  }
  
  setTheme(theme: ThemeOption): void {
    console.log(`Setting theme to: ${theme}`);
    this.currentThemeSubject.next(theme);
    localStorage.setItem('theme', theme);
    
    // Apply theme class to root element
    document.documentElement.setAttribute('data-theme', theme);
    this.applyThemeAndMode();
  }
  
  setMode(mode: ModeOption): void {
    console.log(`Setting mode to: ${mode}`);
    this.currentModeSubject.next(mode);
    localStorage.setItem('mode', mode);
    
    // Apply mode class to root element
    document.documentElement.setAttribute('data-mode', mode);
    this.applyThemeAndMode();
  }
  
  private applyThemeAndMode(): void {
    const theme = this.currentThemeSubject.value;
    const mode = this.currentModeSubject.value;
    
    // Remove all theme-mode classes
    document.documentElement.classList.forEach(className => {
      if (className.startsWith('theme-') || className === 'dark' || className === 'light') {
        document.documentElement.classList.remove(className);
      }
    });
    
    // Add appropriate classes
    document.documentElement.classList.add(`theme-${theme}`);
    document.documentElement.classList.add(mode);
    
    console.log(`Applied theme-${theme} and ${mode} mode`);
  }
  
  getCurrentTheme(): ThemeOption {
    return this.currentThemeSubject.value;
  }
  
  getCurrentMode(): ModeOption {
    return this.currentModeSubject.value;
  }
  
  toggleMode(): void {
    const currentMode = this.getCurrentMode();
    const newMode: ModeOption = currentMode === 'light' ? 'dark' : 'light';
    console.log(`Toggling mode from ${currentMode} to ${newMode}`);
    this.setMode(newMode);
  }
}