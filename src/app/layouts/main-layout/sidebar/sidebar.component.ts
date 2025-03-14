// src/app/layouts/main-layout/sidebar/sidebar.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { PermissionService } from '../../../core/auth/permission.service';
import { HasPermissionDirective } from '../../../shared/directives/has-permission.directive';

// Use a more specific type definition with all properties optional except required ones
interface NavItem {
  label: string;
  route: string;
  icon: string;
  permission?: string;
  exact?: boolean;
  children?: NavItem[];
  expanded?: boolean;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, HasPermissionDirective],
  template: `
    <aside class="bg-slate-800 text-white w-64 shrink-0 hidden lg:block dark:bg-slate-900 flex flex-col h-screen fixed top-16 left-0 z-10 overflow-y-auto"> 
      <!-- User Info Section -->
      <div class="px-3 py-4 border-b border-slate-700 dark:border-slate-800">
  <div class="flex items-center px-3">
    <div class="w-12 h-12 rounded-full bg-slate-600 dark:bg-slate-700 flex items-center justify-center text-white text-lg font-semibold mr-3">
      {{ userInitials }}
    </div>
    <div class="flex flex-col justify-center h-12">
      <p class="text-sm font-medium text-white leading-tight mb-0.1">{{ userName }}</p>
      <div class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
        {{ userRole }}
      </div>
    </div>
  </div>
      </div>
      
      <!-- Navigation Links -->
      <nav class="flex-1 overflow-y-auto px-3 py-4">
        <div *ngFor="let section of navSections; trackBy: trackByIndex" class="mb-6">
          <h3 *ngIf="section.title" class="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            {{ section.title }}
          </h3>
          
          <div class="space-y-1">
            <ng-container *ngFor="let item of section.items; trackBy: trackByIndex">
              <!-- Use permission directive if permission is specified -->
              <a 
                *ngIf="shouldShowItem(item)"
                [routerLink]="item.route" 
                routerLinkActive="bg-slate-700 dark:bg-slate-800 text-white" 
                [routerLinkActiveOptions]="{exact: item.exact || false}"
                class="flex items-center px-3 py-2 text-sm font-medium rounded-md text-slate-100 hover:bg-slate-700 hover:text-white"
              >
                <span class="mr-3 h-6 w-6 flex items-center justify-center" [innerHTML]="item.icon"></span>
                {{ item.label }}
              </a>
            </ng-container>
          </div>
        </div>
      </nav>
      
      <div class="px-3 py-4 border-t border-slate-700 dark:border-slate-800">
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
export class SidebarComponent implements OnInit {
  navSections: NavSection[] = [];
  
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
    // Get actual role from permission service instead of hardcoded value
    return this.permissionService.getRoleIdentifier();
  }
  
  constructor(
    private authService: AuthService,
    private permissionService: PermissionService
  ) {}
  
  ngOnInit(): void {
    this.buildNavigation();
  }
  
  // Helper method to determine if an item should be shown
  shouldShowItem(item: NavItem): boolean {
    if (!item.permission) {
      return true; // No permission required, always show
    }
    return this.permissionService.hasPermission(item.permission);
  }
  
  hasPermission(permission: string): boolean {
    return this.permissionService.hasPermission(permission);
  }
  
  private buildNavigation(): void {
    const allSections: NavSection[] = [
      {
        title: '',
        items: [
          {
            label: 'Dashboard',
            route: '/dashboard',
            icon: '<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>',
            exact: true
          },
          {
            label: 'Auth Test',
            route: '/auth-test',
            icon: '<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>'
          }
        ]
      },
      {
        title: 'User Management',
        items: [
          {
            label: 'My Profile',
            route: '/profile',
            icon: '<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>'
          },
          {
            label: 'User List',
            route: '/users/management',
            icon: '<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>',
            permission: 'users:read'
          },
          {
            label: 'Add New User',
            route: '/users/management/create',
            icon: '<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>',
            permission: 'users:write'
          }
        ]
      },
      {
        title: 'Store Management',
        items: [
          {
            label: 'Stores',
            route: '/stores',
            icon: '<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>',
            permission: 'stores:read'
          },
          {
            label: 'Employees',
            route: '/employees',
            icon: '<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>',
            permission: 'employees:read'
          }
        ]
      },
      {
        title: 'Operations',
        items: [
          {
            label: 'My Timesheets',
            route: '/timesheets',
            icon: '<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>',
            permission: 'hours:read'
          },
          {
            label: 'Timesheet Approval',
            route: '/timesheets/approval',
            icon: '<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>',
            permission: 'hours:approve'
          },
          {
            label: 'Schedules',
            route: '/schedules',
            icon: '<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>',
            permission: 'hours:read'
          },
          {
            label: 'Payments',
            route: '/payments',
            icon: '<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>',
            permission: 'payments:read'
          }
        ]
      },
      {
        title: 'Inventory',
        items: [
          {
            label: 'Inventory',
            route: '/inventory',
            icon: '<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>',
            permission: 'inventory:read'
          },
          {
            label: 'Stock Requests',
            route: '/stock-requests',
            icon: '<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>',
            permission: 'stock-requests:read'
          }
        ]
      },
      {
        title: 'Sales & Reporting',
        items: [
          {
            label: 'Sales',
            route: '/sales',
            icon: '<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>',
            permission: 'sales:read'
          },
          {
            label: 'Reports',
            route: '/reports',
            icon: '<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>',
            permission: 'reports:read'
          }
        ]
      }
    ]
    
    // Filter sections based on permissions
    this.navSections = allSections
      .map(section => {
        // Keep sections that have at least one item with permission
        const filteredItems = section.items.filter(item => this.shouldShowItem(item));
        
        if (filteredItems.length > 0) {
          return { ...section, items: filteredItems };
        }
        
        return null;
      })
      .filter((section): section is NavSection => section !== null);
  }
  
  logout(): void {
    this.authService.logout();
  }
  
  trackByIndex(index: number): number {
    return index;
  }
}