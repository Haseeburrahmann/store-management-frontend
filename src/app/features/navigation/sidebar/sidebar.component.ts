// src/app/features/navigation/sidebar/sidebar.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';

import { AuthService } from '../../../core/services/auth.service';
import { PermissionArea, PermissionAction, getPermissionString } from '../../../shared/models/role.model';

interface NavItem {
  text: string;
  icon: string;
  route: string;
  permission?: string;
  children?: NavItem[];
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatListModule,
    MatIconModule,
    MatDividerModule
  ],
  template: `
    <div class="sidebar">
      <div class="user-info" *ngIf="authService.currentUserValue">
        <div class="avatar">
          <mat-icon>account_circle</mat-icon>
        </div>
        <div class="user-details">
          <div class="user-name">{{ authService.currentUserValue.full_name }}</div>
          <div class="user-role">{{ authService.currentUserValue.role_name || 'User' }}</div>
        </div>
      </div>
      
      <mat-divider></mat-divider>
      
      <mat-nav-list>
        <ng-container *ngFor="let item of navItems">
          <!-- Only show if user has permission -->
          <ng-container *ngIf="!item.permission || authService.hasPermission(item.permission)">
            <a 
              mat-list-item 
              [routerLink]="item.route" 
              routerLinkActive="active-link">
              <mat-icon matListItemIcon>{{ item.icon }}</mat-icon>
              <span matListItemTitle>{{ item.text }}</span>
            </a>
            
            <!-- Render child items if any -->
            <ng-container *ngIf="item.children && item.children.length > 0">
              <a 
                mat-list-item 
                *ngFor="let child of item.children"
                [routerLink]="child.route" 
                routerLinkActive="active-link"
                class="child-item">
                <mat-icon matListItemIcon>{{ child.icon }}</mat-icon>
                <span matListItemTitle>{{ child.text }}</span>
              </a>
            </ng-container>
          </ng-container>
        </ng-container>
      </mat-nav-list>
    </div>
  `,
  styles: [`
    .sidebar {
      height: 100%;
      display: flex;
      flex-direction: column;
    }
    
    .user-info {
      padding: 16px;
      display: flex;
      align-items: center;
      gap: 12px;
    }
    
    .avatar {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      background-color: #e0e0e0;
      border-radius: 50%;
    }
    
    .avatar mat-icon {
      color: #616161;
    }
    
    .user-details {
      display: flex;
      flex-direction: column;
    }
    
    .user-name {
      font-weight: 500;
    }
    
    .user-role {
      font-size: 12px;
      color: #757575;
    }
    
    .active-link {
      background-color: rgba(0, 0, 0, 0.04);
      color: #3f51b5;
    }
    
    .active-link mat-icon {
      color: #3f51b5;
    }
    
    .child-item {
      padding-left: 32px;
    }
  `]
})
export class SidebarComponent implements OnInit {
  navItems: NavItem[] = [];
  
  constructor(public authService: AuthService) {}
  
  ngOnInit() {
    // Define navigation items with required permissions
    this.navItems = [
      { 
        text: 'Dashboard', 
        icon: 'dashboard', 
        route: '/dashboard'
      },
      { 
        text: 'User Management', 
        icon: 'people', 
        route: '/users',
        permission: getPermissionString(PermissionArea.USERS, PermissionAction.READ)
      },
      { 
        text: 'Role Management', 
        icon: 'admin_panel_settings', 
        route: '/roles',
        permission: getPermissionString(PermissionArea.ROLES, PermissionAction.READ)
      },
      { 
        text: 'Store Management', 
        icon: 'store', 
        route: '/stores',
        permission: getPermissionString(PermissionArea.STORES, PermissionAction.READ)
      },
      { 
        text: 'Employee Management', 
        icon: 'badge', 
        route: '/employees',
        permission: getPermissionString(PermissionArea.EMPLOYEES, PermissionAction.READ)
      },
      { 
        text: 'Hours Tracking', 
        icon: 'schedule', 
        route: '/hours',
        permission: getPermissionString(PermissionArea.HOURS, PermissionAction.READ)
      },
      { 
        text: 'Reports', 
        icon: 'assessment', 
        route: '/reports',
        permission: getPermissionString(PermissionArea.REPORTS, PermissionAction.READ),
        children: [
          { 
            text: 'Employee Hours', 
            icon: 'access_time', 
            route: '/reports/hours' 
          },
          { 
            text: 'Sales Report', 
            icon: 'trending_up', 
            route: '/reports/sales' 
          },
          { 
            text: 'Inventory Report', 
            icon: 'inventory', 
            route: '/reports/inventory' 
          }
        ]
      }
    ];
  }
}