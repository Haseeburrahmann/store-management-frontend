// src/app/core/services/theme.service.ts
import { Injectable, Renderer2, RendererFactory2 } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type ThemeOption = 'slate-amber' | 'blue-orange' | 'green-purple';
export type ModeOption = 'light' | 'dark';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private renderer: Renderer2;
  private currentThemeSubject = new BehaviorSubject<ThemeOption>('slate-amber');
  private currentModeSubject = new BehaviorSubject<ModeOption>('light');
  
  public currentTheme$ = this.currentThemeSubject.asObservable();
  public currentMode$ = this.currentModeSubject.asObservable();
  
  constructor(rendererFactory: RendererFactory2) {
    this.renderer = rendererFactory.createRenderer(null, null);
    
    //console.log('ThemeService constructor called');
    
    // Load saved theme from localStorage
    const savedTheme = localStorage.getItem('theme') as ThemeOption;
    if (savedTheme) {
      //console.log(`Loading saved theme: ${savedTheme}`);
      this.setTheme(savedTheme, false);
    }
    
    // Load saved mode from localStorage or use system preference
    const savedMode = localStorage.getItem('mode') as ModeOption;
    if (savedMode) {
      //console.log(`Loading saved mode: ${savedMode}`);
      this.setMode(savedMode, false);
    } else {
      // Check for system preference if no saved mode
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      this.setMode(prefersDark ? 'dark' : 'light', false);
    }
    
    // Apply theme and mode to document
    this.applyThemeAndMode();
    
    // Listen for system preference changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
      if (!localStorage.getItem('mode')) {
        this.setMode(e.matches ? 'dark' : 'light', true);
      }
    });
  }
  
  setTheme(theme: ThemeOption, saveToStorage: boolean = true): void {
    //console.log(`Setting theme to: ${theme}`);
    this.currentThemeSubject.next(theme);
    
    if (saveToStorage) {
      localStorage.setItem('theme', theme);
    }
    
    this.applyThemeAndMode();
  }
  
  setMode(mode: ModeOption, saveToStorage: boolean = true): void {
    //console.log(`Setting mode to: ${mode}`);
    this.currentModeSubject.next(mode);
    
    if (saveToStorage) {
      localStorage.setItem('mode', mode);
    }
    
    this.applyThemeAndMode();
  }
  
  private applyThemeAndMode(): void {
    const theme = this.currentThemeSubject.value;
    const mode = this.currentModeSubject.value;
    
    // Apply mode class to document element
    if (mode === 'dark') {
      this.renderer.addClass(document.documentElement, 'dark');
      this.renderer.removeClass(document.documentElement, 'light');
    } else {
      this.renderer.addClass(document.documentElement, 'light');
      this.renderer.removeClass(document.documentElement, 'dark');
    }
    
    // Apply theme class to document element
    document.documentElement.classList.forEach(className => {
      if (className.startsWith('theme-')) {
        this.renderer.removeClass(document.documentElement, className);
      }
    });
    
    this.renderer.addClass(document.documentElement, `theme-${theme}`);
    
    //console.log(`Applied theme-${theme} and ${mode} mode`);
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
    //console.log(`Toggling mode from ${currentMode} to ${newMode}`);
    this.setMode(newMode);
  }
}