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
    <div class="h-screen flex overflow-hidden bg-[var(--bg-main)] transition-colors duration-200">
      <!-- Sidebar -->
      <app-sidebar></app-sidebar>
      
      <!-- Main content area -->
      <div class="flex-1 flex flex-col overflow-hidden">
        <!-- Header -->
        <app-header class="flex-shrink-0"></app-header>
        
        <!-- Main content - Adding overflow-auto here -->
        <main class="flex-1 overflow-auto lg:pl-64"> 
          <div class="page-container">
            <router-outlet></router-outlet>
          </div>
        </main>
        
        <!-- Footer (optional) -->
        <footer class="flex-shrink-0 py-3 px-6 border-t border-[var(--border-color)] text-center text-xs text-[var(--text-secondary)]">
          <p>&copy; {{ currentYear }} Store Management System. All rights reserved.</p>
        </footer>
      </div>
    </div>
  `,
  styles: [`
    .page-container {
      padding: 1.5rem;
    }
    
    /* Ensure main content scrolls properly on mobile */
    @media (max-width: 1023px) {
      main {
        padding-left: 0 !important;
      }
    }
  `]
})
export class MainLayoutComponent {
  get currentYear(): number {
    return new Date().getFullYear();
  }
}