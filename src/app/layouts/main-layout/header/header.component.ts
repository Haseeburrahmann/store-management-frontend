// src/app/layouts/main-layout/header/header.component.ts
import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { DarkModeToggleComponent } from '../../../shared/components/dark-mode-toggle/dark-mode-toggle.component';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, DarkModeToggleComponent],
  template: `
    <header class="bg-[var(--bg-card)] shadow-sm z-10 py-3 px-4 sm:px-6 lg:px-8 border-b border-[var(--border-color)]">
      <div class="flex justify-between items-center">
        <!-- Mobile menu button -->
        <div class="flex items-center lg:hidden">
          <button 
            type="button" 
            (click)="toggleMobileMenu()"
            class="text-[var(--text-secondary)] hover:text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-inset focus:ring-slate-500"
            aria-expanded="false"
          >
            <span class="sr-only">Open menu</span>
            <!-- Menu icon -->
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
        
        <!-- Search bar -->
        <div class="flex flex-1 justify-center px-2 lg:ml-6 lg:justify-end">
          <div class="w-full max-w-lg lg:max-w-xs">
            <label for="search" class="sr-only">Search</label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <!-- Search icon -->
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-[var(--text-secondary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                id="search"
                class="form-control pl-10"
                placeholder="Search..."
                type="search"
              >
            </div>
          </div>
        </div>
        
        <!-- Right section -->
        <div class="ml-4 flex items-center lg:ml-6">
          <!-- Dark Mode Toggle -->
          <app-dark-mode-toggle></app-dark-mode-toggle>
          
          <!-- Notification button -->
          <button 
            class="ml-4 p-1 rounded-full text-[var(--text-secondary)] hover:text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
            [class.animate-pulse]="hasNotifications"
          >
            <span class="sr-only">View notifications</span>
            <!-- Bell icon -->
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            
            <!-- Notification indicator -->
            <span 
              *ngIf="notificationCount > 0" 
              class="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-slate-800"
            ></span>
          </button>

          <!-- Profile dropdown -->
          <div class="ml-3 relative">
            <div>
              <button 
                type="button" 
                class="flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
                id="user-menu-button"
                (click)="toggleProfileMenu()"
              >
                <span class="sr-only">Open user menu</span>
                <div class="h-8 w-8 rounded-full bg-slate-600 dark:bg-slate-700 flex items-center justify-center text-white">
                  {{ userInitials }}
                </div>
              </button>
            </div>
            
            <!-- Profile dropdown menu -->
            <div 
              *ngIf="showProfileMenu"
              class="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-[var(--bg-card)] ring-1 ring-black ring-opacity-5 focus:outline-none z-10"
              role="menu"
              aria-orientation="vertical"
              aria-labelledby="user-menu-button"
              tabindex="-1"
            >
              <a 
                routerLink="/profile" 
                class="block px-4 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-main)]" 
                role="menuitem" 
                tabindex="-1"
              >
                Your Profile
              </a>
              <a 
                routerLink="/dashboard" 
                class="block px-4 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-main)]" 
                role="menuitem" 
                tabindex="-1"
              >
                Dashboard
              </a>
              <button 
                (click)="logout()" 
                class="block w-full text-left px-4 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-main)]" 
                role="menuitem" 
                tabindex="-1"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Mobile menu, show/hide based on menu state -->
      <div *ngIf="showMobileMenu" class="lg:hidden mt-4 border-t border-[var(--border-color)] pt-4">
        <div class="px-2 pt-2 pb-3 space-y-1">
          <a 
            routerLink="/dashboard" 
            routerLinkActive="bg-slate-100 dark:bg-slate-700 text-[var(--text-primary)]" 
            [routerLinkActiveOptions]="{exact: true}"
            class="block px-3 py-2 rounded-md text-base font-medium text-[var(--text-secondary)] hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-[var(--text-primary)]"
          >
            Dashboard
          </a>
          <a 
            routerLink="/profile" 
            routerLinkActive="bg-slate-100 dark:bg-slate-700 text-[var(--text-primary)]"
            class="block px-3 py-2 rounded-md text-base font-medium text-[var(--text-secondary)] hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-[var(--text-primary)]"
          >
            Profile
          </a>
          <a 
            routerLink="/stores" 
            routerLinkActive="bg-slate-100 dark:bg-slate-700 text-[var(--text-primary)]"
            class="block px-3 py-2 rounded-md text-base font-medium text-[var(--text-secondary)] hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-[var(--text-primary)]"
          >
            Stores
          </a>
          <a 
            routerLink="/employees" 
            routerLinkActive="bg-slate-100 dark:bg-slate-700 text-[var(--text-primary)]"
            class="block px-3 py-2 rounded-md text-base font-medium text-[var(--text-secondary)] hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-[var(--text-primary)]"
          >
            Employees
          </a>
        </div>
      </div>
    </header>
  `
})
export class HeaderComponent implements OnInit {
  showProfileMenu = false;
  showMobileMenu = false;
  notificationCount = 3; // Placeholder
  
  get hasNotifications(): boolean {
    return this.notificationCount > 0;
  }
  
  get userInitials(): string {
    const user = this.authService.currentUser;
    if (!user?.full_name) return 'AU';
    
    const names = user.full_name.split(' ');
    if (names.length === 1) return names[0].charAt(0).toUpperCase();
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
  }
  
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}
  
  ngOnInit(): void {
    // Initialize component
  }
  
  @HostListener('document:click', ['$event'])
  handleDocumentClick(event: MouseEvent): void {
    // Close profile menu when clicking outside
    const profileMenuButton = document.getElementById('user-menu-button');
    if (profileMenuButton && !profileMenuButton.contains(event.target as Node) && this.showProfileMenu) {
      this.showProfileMenu = false;
    }
    
    // Close mobile menu when clicking outside
    const mobileMenuButton = document.querySelector('.lg\\:hidden button');
    if (mobileMenuButton && !mobileMenuButton.contains(event.target as Node) && 
        !document.querySelector('.lg\\:hidden .mt-4')?.contains(event.target as Node) && 
        this.showMobileMenu) {
      this.showMobileMenu = false;
    }
  }
  
  toggleProfileMenu(): void {
    this.showProfileMenu = !this.showProfileMenu;
  }
  
  toggleMobileMenu(): void {
    this.showMobileMenu = !this.showMobileMenu;
  }
  
  logout(): void {
    this.authService.logout();
  }
  
  // Check if the current user has notifications
  checkNotifications(): void {
    // This would typically be a service call to check notifications
    // For now, we're using a placeholder value
    this.notificationCount = 3;
  }
  getCurrentDateTime(): string {
    const now = new Date();
    return now.toLocaleDateString() + ' ' + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
}