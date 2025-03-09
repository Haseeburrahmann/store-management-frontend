// src/app/layouts/main-layout/main-layout.component.ts
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './header/header.component';
import { SidebarComponent } from './sidebar/sidebar.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, SidebarComponent, CommonModule],
  template: `
    <div class="h-screen flex bg-[var(--bg-main)] transition-colors duration-200">
      <!-- Sidebar -->
      <app-sidebar></app-sidebar>
      
      <!-- Main content area -->
      <div class="flex-1 flex flex-col overflow-hidden">
        <!-- Header -->
        <app-header></app-header>
        
        <!-- Main content -->
        <main class="flex-1 overflow-y-auto p-4 md:p-6">
          <div class="page-container">
            <router-outlet></router-outlet>
          </div>
        </main>
        
        <!-- Footer (optional) -->
        <footer class="py-3 px-6 border-t border-[var(--border-color)] text-center text-xs text-[var(--text-secondary)]">
          <p>&copy; {{ currentYear }} Store Management System. All rights reserved.</p>
        </footer>
      </div>
    </div>
  `
})
export class MainLayoutComponent {
  get currentYear(): number {
    return new Date().getFullYear();
  }
}