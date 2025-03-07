// src/app/features/navigation/navigation.component.ts
import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatSidenavModule, MatSidenav } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { AuthService } from '../../core/services/auth.service';
import { IconService } from '../../core/services/icon.service';
import { ThemeService, ThemeMode } from '../../core/services/theme.service';
import { Observable, tap } from 'rxjs';

export interface NavigationItem {
  name: string;
  icon: string;
  route: string;
  requiredPermission?: string;
  children?: NavigationItem[];
}

@Component({
  selector: 'app-navigation',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatSidenavModule,
    MatToolbarModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatDividerModule
  ],
  template: `
    <div class="navigation-container">
      <mat-toolbar class="header-toolbar" color="primary">
        <button
          mat-icon-button
          class="menu-button"
          (click)="sidenav.toggle()"
          aria-label="Toggle sidenav">
          <mat-icon>{{ sidenav.opened ? 'menu_open' : 'menu' }}</mat-icon>
        </button>
        
        <a class="app-title" routerLink="/">
          <span>Store Management</span>
        </a>
        
        <span class="toolbar-spacer"></span>
        
        <!-- Theme Toggle -->
        <button 
          mat-icon-button 
          (click)="toggleTheme()" 
          aria-label="Toggle theme"
          class="theme-toggle"
          matTooltip="Toggle dark mode">
          <mat-icon>{{ (themeMode$ | async) === 'dark' ? 'light_mode' : 'dark_mode' }}</mat-icon>
        </button>
        
        <!-- User Menu -->
        <button 
          mat-icon-button 
          [matMenuTriggerFor]="userMenu" 
          aria-label="User menu"
          class="user-menu-button">
          <mat-icon>account_circle</mat-icon>
        </button>
        
        <mat-menu #userMenu="matMenu">
          <div class="user-info">
            <div class="user-avatar">
              <mat-icon>account_circle</mat-icon>
            </div>
            <div class="user-details">
              <span class="user-name">{{ (currentUser$ | async)?.fullName }}</span>
              <span class="user-role">{{ (currentUser$ | async)?.role?.name }}</span>
            </div>
          </div>
          
          <mat-divider></mat-divider>
          
          <button mat-menu-item routerLink="/profile">
            <mat-icon>person</mat-icon>
            <span>My Profile</span>
          </button>
          
          <button mat-menu-item (click)="logout()">
            <mat-icon>exit_to_app</mat-icon>
            <span>Logout</span>
          </button>
        </mat-menu>
      </mat-toolbar>
      
      <mat-sidenav-container class="sidenav-container">
        <mat-sidenav
          #sidenav
          [mode]="isMobile ? 'over' : 'side'"
          [opened]="!isMobile"
          class="sidenav">
          
          <div class="sidenav-content">
            <!-- Main Navigation -->
            <div class="nav-section">
              <mat-nav-list>
                <ng-container *ngFor="let item of navigationItems">
                  <!-- Only show items for which the user has permission -->
                  <a mat-list-item 
                     *ngIf="!item.requiredPermission || hasPermission(item.requiredPermission)"
                     [routerLink]="item.route" 
                     routerLinkActive="active-link"
                     (click)="isMobile ? sidenav.close() : null">
                    <mat-icon matListItemIcon>{{ item.icon }}</mat-icon>
                    <span matListItemTitle>{{ item.name }}</span>
                  </a>
                  
                  <!-- Handle nested navigation -->
                  <ng-container *ngIf="item.children && item.children.length > 0">
                    <mat-divider></mat-divider>
                    
                    <div class="nested-nav-group">
                      <span class="nested-nav-title">{{ item.name }}</span>
                      
                      <a mat-list-item 
                         *ngFor="let child of item.children"
                         [routerLink]="child.route" 
                         routerLinkActive="active-link"
                         (click)="isMobile ? sidenav.close() : null"
                         class="nested-nav-item"
                         [class.hidden]="child.requiredPermission && !hasPermission(child.requiredPermission)">
                        <mat-icon matListItemIcon>{{ child.icon }}</mat-icon>
                        <span matListItemTitle>{{ child.name }}</span>
                      </a>
                    </div>
                    
                    <mat-divider></mat-divider>
                  </ng-container>
                </ng-container>
              </mat-nav-list>
            </div>
            
            <div class="sidenav-footer">
              <mat-divider></mat-divider>
              <div class="app-version">
                <span>v1.0.0</span>
              </div>
            </div>
          </div>
        </mat-sidenav>
        
        <mat-sidenav-content class="main-content">
          <div class="content-container" [class.is-mobile]="isMobile">
            <ng-content></ng-content>
          </div>
        </mat-sidenav-content>
      </mat-sidenav-container>
    </div>
  `,
  styles: [`
    .navigation-container {
      display: flex;
      flex-direction: column;
      height: 100%;
    }
    
    .header-toolbar {
      z-index: 2;
      box-shadow: 0 2px 4px rgba(0,0,0,.1);
    }
    
    .app-title {
      font-size: 20px;
      font-weight: 500;
      text-decoration: none;
      color: white;
      display: flex;
      align-items: center;
    }
    
    .toolbar-spacer {
      flex: 1 1 auto;
    }
    
    .sidenav-container {
      flex: 1;
    }
    
    .sidenav {
      width: 260px;
      border-right: 1px solid rgba(0,0,0,.12);
      display: flex;
      flex-direction: column;
    }
    
    .sidenav-content {
      display: flex;
      flex-direction: column;
      height: 100%;
    }
    
    .nav-section {
      flex: 1;
      overflow-y: auto;
    }
    
    .active-link {
      background-color: rgba(var(--app-primary-rgb), 0.1);
      color: var(--app-primary);
      font-weight: 500;
    }
    
    .nested-nav-group {
      padding: 8px 0;
    }
    
    .nested-nav-title {
      padding: 0 16px;
      font-size: 12px;
      font-weight: 500;
      color: rgba(0,0,0,.54);
      text-transform: uppercase;
      display: block;
      margin: 8px 0;
    }
    
    .nested-nav-item {
      padding-left: 32px;
    }
    
    .hidden {
      display: none;
    }
    
    .sidenav-footer {
      padding: 16px;
    }
    
    .app-version {
      font-size: 12px;
      color: rgba(0,0,0,.54);
      text-align: center;
      padding: 8px 0;
    }
    
    .main-content {
      height: 100%;
      overflow-y: auto;
    }
    
    .content-container {
      padding: 24px;
      max-width: 1600px;
      margin: 0 auto;
    }
    
    .content-container.is-mobile {
      padding: 16px;
    }
    
    .user-info {
      display: flex;
      align-items: center;
      padding: 16px;
    }
    
    .user-avatar {
      margin-right: 12px;
    }
    
    .user-avatar mat-icon {
      font-size: 48px;
      height: 48px;
      width: 48px;
    }
    
    .user-details {
      display: flex;
      flex-direction: column;
    }
    
    .user-name {
      font-weight: 500;
      font-size: 16px;
    }
    
    .user-role {
      font-size: 14px;
      color: rgba(0,0,0,.54);
    }
    
    :host-context(.dark-theme) {
      .nested-nav-title {
        color: rgba(255,255,255,.7);
      }
      
      .app-version {
        color: rgba(255,255,255,.7);
      }
      
      .user-role {
        color: rgba(255,255,255,.7);
      }
      
      .active-link {
        background-color: rgba(var(--app-primary-rgb), 0.2);
      }
    }
  `]
})
export class NavigationComponent implements OnInit {
  @ViewChild('sidenav') sidenav!: MatSidenav;
  
  isMobile = false;
  navigationItems: NavigationItem[] = [
    {
      name: 'Dashboard',
      icon: 'dashboard',
      route: '/dashboard'
    },
    {
      name: 'Stores',
      icon: 'store',
      route: '/stores',
      requiredPermission: 'stores:read'
    },
    {
      name: 'Employees',
      icon: 'people',
      route: '/employees',
      requiredPermission: 'employees:read'
    },
    {
      name: 'Hours',
      icon: 'schedule',
      route: '/hours',
      requiredPermission: 'hours:read'
    },
    {
      name: 'Payments',
      icon: 'payment',
      route: '/payments',
      requiredPermission: 'payments:read'
    },
    {
      name: 'Inventory',
      icon: 'inventory',
      route: '/inventory',
      requiredPermission: 'inventory:read'
    },
    {
      name: 'Sales',
      icon: 'point_of_sale',
      route: '/sales',
      requiredPermission: 'sales:read'
    },
    {
      name: 'Reports',
      icon: 'bar_chart',
      route: '/reports',
      requiredPermission: 'reports:read'
    },
    {
      name: 'Administration',
      icon: 'admin_panel_settings',
      route: '/admin',
      requiredPermission: 'roles:read',
      children: [
        {
          name: 'Users',
          icon: 'person',
          route: '/admin/users',
          requiredPermission: 'users:read'
        },
        {
          name: 'Roles',
          icon: 'security',
          route: '/admin/roles',
          requiredPermission: 'roles:read'
        },
        {
          name: 'Settings',
          icon: 'settings',
          route: '/admin/settings',
          requiredPermission: 'roles:read'
        }
      ]
    }
  ];
  
  currentUser$: Observable<any>;
  themeMode$: Observable<ThemeMode>;
  
  constructor(
    private breakpointObserver: BreakpointObserver,
    private authService: AuthService,
    private iconService: IconService,
    private themeService: ThemeService
  ) {
    this.currentUser$ = this.authService.user$;
    this.themeMode$ = this.themeService.getThemeMode();
  }
  
  ngOnInit(): void {
    // Monitor screen size changes
    this.breakpointObserver.observe([
      Breakpoints.XSmall,
      Breakpoints.Small
    ]).pipe(
      tap(result => {
        this.isMobile = result.matches;
      })
    ).subscribe();
  }
  
  hasPermission(permission: string): boolean {
    // Using the legacy method since we're passing a single permission string
    return this.authService.hasPermissionLegacy(permission);
  }
  
  toggleTheme(): void {
    this.themeService.toggleTheme();
  }
  
  logout(): void {
    this.authService.logout();
  }
}