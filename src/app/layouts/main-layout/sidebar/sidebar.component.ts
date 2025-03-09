// src/app/layouts/main-layout/sidebar/sidebar.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { PermissionService } from '../../../core/auth/permission.service';
import { HasPermissionDirective } from '../../../shared/directives/has-permission.directive';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, HasPermissionDirective],
  template: `
    <aside class="bg-slate-800 text-white w-64 shrink-0 hidden lg:block dark:bg-slate-900">
      <div class="h-16 flex items-center px-6 border-b border-slate-700 dark:border-slate-800">
        <h1 class="text-xl font-bold text-white">Store Management</h1>
      </div>
      
      <!-- User Info Section -->
      <div class="px-3 py-4 border-b border-slate-700 dark:border-slate-800">
        <div class="px-3">
          <h2 class="text-sm font-medium text-slate-300">Admin User</h2>
          <p class="text-sm text-white">{{ userRole }}</p>
        </div>
        
        <div class="flex items-center mt-4 px-3">
          <div class="w-8 h-8 rounded-full bg-slate-300 dark:bg-slate-400 flex items-center justify-center text-slate-900 dark:text-slate-800 font-semibold mr-2">
            {{ userInitials }}
          </div>
          <div>
            <p class="text-sm font-medium text-white">{{ userName }}</p>
          </div>
        </div>
      </div>
      
      <!-- Navigation Links -->
      <nav class="mt-4 px-3 space-y-1">
        <a 
          routerLink="/dashboard" 
          routerLinkActive="bg-slate-700 dark:bg-slate-800 text-white" 
          [routerLinkActiveOptions]="{exact: true}"
          class="flex items-center px-3 py-2 text-sm font-medium rounded-md text-slate-100 hover:bg-slate-700 hover:text-white"
        >
          <span class="mr-3 h-6 w-6 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </span>
          Dashboard
        </a>
        
        <a 
          routerLink="/profile" 
          routerLinkActive="bg-slate-700 dark:bg-slate-800 text-white" 
          class="flex items-center px-3 py-2 text-sm font-medium rounded-md text-slate-100 hover:bg-slate-700 hover:text-white"
        >
          <span class="mr-3 h-6 w-6 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </span>
          Profile
        </a>
        
        <!-- Add additional navigation links based on permissions here -->
      </nav>
      
      <div class="mt-auto px-3 py-4 border-t border-slate-700 dark:border-slate-800">
        <button 
          (click)="logout()" 
          class="w-full flex items-center px-3 py-2 text-sm font-medium rounded-md text-slate-100 hover:bg-slate-700 hover:text-white"
        >
          <span class="mr-3 h-6 w-6 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </span>
          Sign Out
        </button>
      </div>
    </aside>
  `
})
export class SidebarComponent {
  get userInitials(): string {
    const user = this.authService.currentUser;
    if (!user?.full_name) return 'AU';
    
    const names = user.full_name.split(' ');
    if (names.length === 1) return names[0].charAt(0).toUpperCase();
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
  }
  
  get userName(): string {
    return this.authService.currentUser?.full_name || 'Admin';
  }
  
  get userRole(): string {
    // Return role based on permissions or default to Admin
    return 'Admin';
  }
  
  constructor(
    private authService: AuthService,
    private permissionService: PermissionService
  ) {}
  
  logout(): void {
    this.authService.logout();
  }
}