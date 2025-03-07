// src/app/core/components/navigation/app-navigation.component.ts
import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule, MatSidenav } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatBadgeModule } from '@angular/material/badge';
import { Subscription } from 'rxjs';

import { AuthService } from '../../core/services/auth.service';
import { UserWithPermissions } from '../../core/auth/models/user.model';

interface NavItem {
  name: string;
  route?: string;
  icon: string;
  permission?: string;
  children?: NavItem[];
  badge?: number;
}

@Component({
  selector: 'app-navigation',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatSidenavModule,
    MatListModule,
    MatExpansionModule,
    MatMenuModule,
    MatDividerModule,
    MatTooltipModule,
    MatBadgeModule
  ],
  template: `
   <div class="app-container">
  <!-- Top Navigation -->
  <mat-toolbar color="primary" class="top-toolbar">
    <button mat-icon-button (click)="toggleSidenav()" class="menu-button">
      <mat-icon>{{ sidenavOpened ? 'menu_open' : 'menu' }}</mat-icon>
    </button>
    
    <div class="toolbar-logo">
      <mat-icon>store</mat-icon>
      <span class="toolbar-title">Store Management</span>
    </div>
    
    <span class="toolbar-spacer"></span>
    
    <!-- Notifications Button -->
    <button mat-icon-button class="notification-button" matTooltip="Notifications">
      <mat-icon [matBadge]="3" matBadgeColor="accent">notifications</mat-icon>
    </button>
    
    <!-- User Menu -->
    <div *ngIf="currentUser" class="user-menu">
      <button mat-button [matMenuTriggerFor]="userMenu" class="user-button">
        <div class="user-avatar">{{ getUserInitials() }}</div>
        <span class="username">{{ currentUser.full_name }}</span>
        <mat-icon>arrow_drop_down</mat-icon>
      </button>
      <mat-menu #userMenu="matMenu" class="user-dropdown">
        <div class="user-menu-header">
          <div class="user-menu-avatar">{{ getUserInitials() }}</div>
          <div class="user-menu-info">
            <span class="user-menu-name">{{ currentUser.full_name }}</span>
            <span class="user-menu-email">{{ currentUser.email }}</span>
          </div>
        </div>
        <mat-divider></mat-divider>
        <button mat-menu-item routerLink="/profile">
          <mat-icon>person</mat-icon>
          <span>My Profile</span>
        </button>
        <button mat-menu-item routerLink="/dashboard">
          <mat-icon>dashboard</mat-icon>
          <span>Dashboard</span>
        </button>
        <mat-divider></mat-divider>
        <button mat-menu-item (click)="logout()">
          <mat-icon>exit_to_app</mat-icon>
          <span>Logout</span>
        </button>
      </mat-menu>
    </div>
  </mat-toolbar>
  
  <!-- Main Content Area with Sidenav -->
  <mat-sidenav-container class="sidenav-container">
    <mat-sidenav #sidenav [mode]="'side'" [opened]="sidenavOpened" class="sidenav" 
                [fixedInViewport]="true" [fixedTopGap]="64">
      <div class="sidenav-content">
        <div class="sidenav-search">
          <div class="search-input">
            <mat-icon>search</mat-icon>
            <input type="text" placeholder="Search...">
          </div>
        </div>
        
        <mat-nav-list class="nav-list">
          <!-- Dashboard -->
          <a mat-list-item routerLink="/dashboard" routerLinkActive="active-link" class="nav-item">
            <mat-icon>dashboard</mat-icon>
            <span class="nav-label">Dashboard</span>
          </a>
          
          <mat-divider class="nav-divider"></mat-divider>
          
          <!-- For each navigation section -->
          <ng-container *ngFor="let item of navItems">
            <!-- Items with children (dropdown) -->
            <ng-container *ngIf="item.children && item.children.length && hasPermission(item.permission)">
              <mat-expansion-panel class="nav-expansion-panel" [expanded]="isPanelExpanded(item)">
                <mat-expansion-panel-header class="nav-panel-header">
                  <mat-panel-title class="nav-panel-title">
                    <mat-icon>{{ item.icon }}</mat-icon>
                    <span class="nav-label">{{ item.name }}</span>
                    <span *ngIf="item.badge" class="nav-badge">{{ item.badge }}</span>
                  </mat-panel-title>
                </mat-expansion-panel-header>
                
                <div class="sub-nav-list">
                  <a 
                    *ngFor="let child of item.children"
                    mat-list-item 
                    [routerLink]="child.route" 
                    routerLinkActive="active-sub-link"
                    class="sub-nav-item"
                    [style.display]="hasPermission(child.permission) ? 'flex' : 'none'"
                  >
                    <mat-icon>{{ child.icon }}</mat-icon>
                    <span class="nav-label">{{ child.name }}</span>
                    <span *ngIf="child.badge" class="nav-badge sub-badge">{{ child.badge }}</span>
                  </a>
                </div>
              </mat-expansion-panel>
            </ng-container>
            
            <!-- Items without children (direct links) -->
            <a 
              *ngIf="!item.children && hasPermission(item.permission)"
              mat-list-item 
              [routerLink]="item.route" 
              routerLinkActive="active-link"
              class="nav-item"
            >
              <mat-icon>{{ item.icon }}</mat-icon>
              <span class="nav-label">{{ item.name }}</span>
              <span *ngIf="item.badge" class="nav-badge">{{ item.badge }}</span>
            </a>
          </ng-container>
        </mat-nav-list>
      </div>
      
      <div class="sidenav-footer">
        <mat-divider></mat-divider>
        <button mat-button (click)="logout()" class="logout-button">
          <mat-icon>exit_to_app</mat-icon>
          <span>Logout</span>
        </button>
      </div>
    </mat-sidenav>
    
    <!-- Main Content -->
    <mat-sidenav-content>
      <div class="content-container" [ngClass]="{'content-shifted': sidenavOpened}">
        <ng-content></ng-content>
      </div>
    </mat-sidenav-content>
  </mat-sidenav-container>
</div>
  `,
   styleUrls: ['./navigation.component.scss']
})
export class AppNavigationComponent implements OnInit, OnDestroy {
  @ViewChild('sidenav') sidenav!: MatSidenav;
  
  currentUser: UserWithPermissions | null = null;
  sidenavOpened = true;
  
  navItems: NavItem[] = [
    {
      name: 'User Management',
      icon: 'people',
      permission: 'users:read',
      children: [
        { name: 'Users', route: '/users', icon: 'person', permission: 'users:read' },
        { name: 'Roles', route: '/roles', icon: 'security', permission: 'roles:read' }
      ]
    },
    {
      name: 'Store Management',
      icon: 'store',
      permission: 'stores:read',
      children: [
        { name: 'Stores', route: '/stores', icon: 'storefront', permission: 'stores:read' },
        { name: 'Employees', route: '/employees', icon: 'badge', permission: 'employees:read' }
      ]
    },
    {
      name: 'Hours & Timesheets',
      icon: 'schedule',
      permission: 'hours:read',
      badge: 3,
      children: [
        { name: 'Hours List', route: '/hours', icon: 'list', permission: 'hours:read' },
        { name: 'Clock In/Out', route: '/hours/clock', icon: 'timer', permission: 'hours:write' },
        { name: 'Approvals', route: '/hours/approval', icon: 'check_circle', permission: 'hours:approve', badge: 3 }
      ]
    },
    {
      name: 'Reports',
      route: '/reports',
      icon: 'bar_chart',
      permission: 'reports:read'
    }
  ];
  
  private userSubscription: Subscription | null = null;
  
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}
  
  ngOnInit(): void {
    this.userSubscription = this.authService.user$.subscribe(user => {
      this.currentUser = user;
    });
    
    // Adjust sidenav based on screen size
    this.checkScreenSize();
    window.addEventListener('resize', this.checkScreenSize.bind(this));
  }
  
  ngOnDestroy(): void {
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
    window.removeEventListener('resize', this.checkScreenSize.bind(this));
  }
  
  checkScreenSize(): void {
    if (window.innerWidth < 768) {
      this.sidenavOpened = false;
    } else {
      this.sidenavOpened = true;
    }
  }
  
  toggleSidenav(): void {
    this.sidenavOpened = !this.sidenavOpened;
  }
  
  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
  
  hasPermission(permission?: string): boolean {
    if (!permission) return true; // If no permission required, show the item
    
    if (!this.currentUser) return false;
    
    return this.authService.hasPermission(
      permission.split(':')[0], 
      permission.split(':')[1]
    );
  }
  
  getUserInitials(): string {
    if (!this.currentUser || !this.currentUser.full_name) return '';
    
    const names = this.currentUser.full_name.split(' ');
    if (names.length >= 2) {
      return (names[0][0] + names[1][0]).toUpperCase();
    } else if (names.length === 1) {
      return names[0][0].toUpperCase();
    }
    
    return '';
  }
  
  isPanelExpanded(item: NavItem): boolean {
    // Check if any children routes are active
    if (!item.children) return false;
    
    const currentUrl = this.router.url;
    return item.children.some(child => currentUrl.startsWith(child.route || ''));
  }
}