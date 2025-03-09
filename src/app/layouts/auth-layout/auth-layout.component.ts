// src/app/layouts/auth-layout/auth-layout.component.ts
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { DarkModeToggleComponent } from '../../shared/components/dark-mode-toggle/dark-mode-toggle.component';

@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [RouterOutlet, CommonModule, DarkModeToggleComponent],
  template: `
    <div class="min-h-screen flex flex-col bg-[var(--bg-main)]">
      <!-- Header with dark mode toggle -->
      <header class="p-4 border-b border-[var(--border-color)]">
        <div class="container mx-auto flex justify-between items-center">
          <div class="flex items-center">
            <!-- Replace with your actual logo -->
            <div class="h-8 w-8 rounded-md bg-slate-800 dark:bg-slate-700 flex items-center justify-center text-white font-bold">
              S
            </div>
            <span class="ml-2 text-xl font-bold">Store Management</span>
          </div>
          <app-dark-mode-toggle></app-dark-mode-toggle>
        </div>
      </header>
      
      <!-- Main content -->
      <main class="flex-grow flex items-center justify-center p-4">
        <div class="max-w-md w-full">
          <router-outlet></router-outlet>
        </div>
      </main>
      
      <!-- Footer -->
      <footer class="py-4 text-center text-sm text-gray-500 dark:text-gray-400">
        <div class="container mx-auto">
          &copy; {{currentYear}} Store Management System. All rights reserved.
        </div>
      </footer>
    </div>
  `
})
export class AuthLayoutComponent {
  get currentYear(): number {
    return new Date().getFullYear();
  }
}