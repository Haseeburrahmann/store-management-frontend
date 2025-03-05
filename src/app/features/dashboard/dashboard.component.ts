import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';

import { AuthService } from '../../core/services/auth.service';
import { UserWithPermissions } from '../../core/auth/models/user.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule, 
    MatCardModule, 
    MatButtonModule, 
    MatIconModule, 
    MatProgressSpinnerModule,
    RouterModule
  ],
  template: `
    <div class="dashboard-container">
      <!-- Header -->
      <header class="app-header">
        <div class="header-content">
          <h1>Store Management System</h1>
          <div class="user-controls">
            <span *ngIf="user" class="user-email">{{ user.email }}</span>
            <button mat-icon-button (click)="logout()" aria-label="Logout">
              <mat-icon>exit_to_app</mat-icon>
            </button>
          </div>
        </div>
      </header>
      
      <div class="content-area">
        <!-- Sidebar -->
        <aside class="app-sidebar">
          <div class="sidebar-content">
            <div class="user-info">
              <h3 *ngIf="user">{{ user.full_name || 'User' }}</h3>
              <p *ngIf="userRole">{{ userRole }}</p>
              <div *ngIf="!user" class="user-loading">Loading user info...</div>
            </div>
            
            <nav class="sidebar-nav">
              <a class="nav-item" routerLink="/dashboard" routerLinkActive="active">Dashboard</a>
              
              <!-- Debug information - remove in production -->
              <div *ngIf="isAdmin" class="debug-info">Admin Role Detected</div>
              
              <!-- Always show these links for admin role -->
              <ng-container *ngIf="isAdmin">
                <a class="nav-item" routerLink="/users" routerLinkActive="active">Users</a>
                <a class="nav-item" routerLink="/roles" routerLinkActive="active">Roles</a>
                <a class="nav-item" routerLink="/stores" routerLinkActive="active">Stores</a>
                <a class="nav-item" routerLink="/employees" routerLinkActive="active">Employees</a>
                <a class="nav-item" routerLink="/hours" routerLinkActive="active">Hours</a>
              </ng-container>
              
              <!-- Show based on permissions -->
              <ng-container *ngIf="!isAdmin">
                <a *ngIf="canAccessUsers" class="nav-item" routerLink="/users" routerLinkActive="active">Users</a>
                <a *ngIf="canAccessRoles" class="nav-item" routerLink="/roles" routerLinkActive="active">Roles</a>
                <a *ngIf="canAccessStores" class="nav-item" routerLink="/stores" routerLinkActive="active">Stores</a>
                <a *ngIf="canAccessEmployees" class="nav-item" routerLink="/employees" routerLinkActive="active">Employees</a>
                <a *ngIf="canAccessHours" class="nav-item" routerLink="/hours" routerLinkActive="active">Hours</a>
              </ng-container>
              
              <a class="nav-item" routerLink="/profile" routerLinkActive="active">My Profile</a>
            </nav>
          </div>
        </aside>
        
        <!-- Main Content -->
        <main class="main-content">
          <div class="main-container">
            <h2>Dashboard</h2>
            
            <!-- Show loading spinner while fetching data -->
            <div *ngIf="isLoading" class="loading-container">
              <mat-spinner diameter="40"></mat-spinner>
              <p>Loading dashboard data...</p>
            </div>
            
            <!-- Error message if needed -->
            <div *ngIf="error" class="error-message">
              {{ error }}
            </div>
            
            <div *ngIf="!isLoading" class="dashboard-grid">
              <!-- Quick Stats Row -->
              <div class="stats-row">
                <mat-card class="dashboard-card stats-card">
                  <mat-card-content>
                    <div class="stat-content">
                      <div class="stat-icon">
                        <mat-icon>people</mat-icon>
                      </div>
                      <div class="stat-info">
                        <h3>32</h3>
                        <p>Total Employees</p>
                      </div>
                    </div>
                  </mat-card-content>
                </mat-card>
                
                <mat-card class="dashboard-card stats-card">
                  <mat-card-content>
                    <div class="stat-content">
                      <div class="stat-icon">
                        <mat-icon>schedule</mat-icon>
                      </div>
                      <div class="stat-info">
                        <h3>126</h3>
                        <p>Hours This Week</p>
                      </div>
                    </div>
                  </mat-card-content>
                </mat-card>
                
                <mat-card class="dashboard-card stats-card">
                  <mat-card-content>
                    <div class="stat-content">
                      <div class="stat-icon">
                        <mat-icon>payments</mat-icon>
                      </div>
                      <div class="stat-info">
                        <h3>$12,450</h3>
                        <p>Total Payments</p>
                      </div>
                    </div>
                  </mat-card-content>
                </mat-card>
                
                <mat-card class="dashboard-card stats-card">
                  <mat-card-content>
                    <div class="stat-content">
                      <div class="stat-icon">
                        <mat-icon>inventory_2</mat-icon>
                      </div>
                      <div class="stat-info">
                        <h3>15</h3>
                        <p>Low Stock Items</p>
                      </div>
                    </div>
                  </mat-card-content>
                </mat-card>
              </div>
              
              <!-- Details Cards -->
              <div class="details-row">
                <mat-card class="dashboard-card">
                  <mat-card-header>
                    <mat-card-title>Recent Activity</mat-card-title>
                  </mat-card-header>
                  <mat-card-content>
                    <div class="activity-item">
                      <div class="activity-icon"><mat-icon>person</mat-icon></div>
                      <div class="activity-details">
                        <p class="activity-title">New employee added</p>
                        <p class="activity-time">2 hours ago</p>
                      </div>
                    </div>
                    <div class="activity-item">
                      <div class="activity-icon"><mat-icon>update</mat-icon></div>
                      <div class="activity-details">
                        <p class="activity-title">Hours updated for John Smith</p>
                        <p class="activity-time">5 hours ago</p>
                      </div>
                    </div>
                    <div class="activity-item">
                      <div class="activity-icon"><mat-icon>shopping_cart</mat-icon></div>
                      <div class="activity-details">
                        <p class="activity-title">Inventory order placed</p>
                        <p class="activity-time">Yesterday</p>
                      </div>
                    </div>
                    <div class="activity-item">
                      <div class="activity-icon"><mat-icon>attach_money</mat-icon></div>
                      <div class="activity-details">
                        <p class="activity-title">Payment processed</p>
                        <p class="activity-time">Yesterday</p>
                      </div>
                    </div>
                  </mat-card-content>
                </mat-card>
                
                <mat-card class="dashboard-card">
                  <mat-card-header>
                    <mat-card-title>Upcoming Shifts</mat-card-title>
                  </mat-card-header>
                  <mat-card-content>
                    <table class="shifts-table">
                      <thead>
                        <tr>
                          <th>Employee</th>
                          <th>Date</th>
                          <th>Time</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>Jane Doe</td>
                          <td>Today</td>
                          <td>9:00 AM - 5:00 PM</td>
                        </tr>
                        <tr>
                          <td>John Smith</td>
                          <td>Today</td>
                          <td>12:00 PM - 8:00 PM</td>
                        </tr>
                        <tr>
                          <td>Alice Johnson</td>
                          <td>Tomorrow</td>
                          <td>8:00 AM - 4:00 PM</td>
                        </tr>
                        <tr>
                          <td>Robert Brown</td>
                          <td>Tomorrow</td>
                          <td>2:00 PM - 10:00 PM</td>
                        </tr>
                      </tbody>
                    </table>
                  </mat-card-content>
                </mat-card>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-container {
      display: flex;
      flex-direction: column;
      height: 100vh;
      overflow: hidden;
    }
    
    .app-header {
      background-color: #3f51b5;
      color: white;
      padding: 0.5rem 1rem;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      z-index: 10;
    }
    
    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      max-width: 1200px;
      margin: 0 auto;
      width: 100%;
    }
    
    .user-controls {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    
    .user-email {
      font-size: 14px;
    }
    
    .content-area {
      display: flex;
      flex: 1;
      overflow: hidden;
    }
    
    .app-sidebar {
      width: 250px;
      background-color: #f5f5f5;
      border-right: 1px solid #e0e0e0;
      height: 100%;
      overflow-y: auto;
    }
    
    .sidebar-content {
      display: flex;
      flex-direction: column;
      height: 100%;
    }
    
    .user-info {
      padding: 1rem;
      border-bottom: 1px solid rgba(0, 0, 0, 0.1);
      background-color: rgba(63, 81, 181, 0.05);
    }
    
    .user-info h3 {
      margin: 0;
      font-size: 1.1rem;
      color: #3f51b5;
    }
    
    .user-info p {
      margin: 0.25rem 0 0;
      color: rgba(0, 0, 0, 0.6);
      font-size: 0.9rem;
    }
    
    .user-loading {
      font-style: italic;
      font-size: 0.9rem;
      color: #666;
    }
    
    .sidebar-nav {
      flex: 1;
      padding: 1rem 0;
    }
    
    .nav-item {
      display: block;
      padding: 0.75rem 1.5rem;
      margin: 0.25rem 0;
      color: rgba(0, 0, 0, 0.87);
      text-decoration: none;
      border-radius: 0 24px 24px 0;
      transition: all 0.2s ease;
      cursor: pointer;
    }
    
    .nav-item:hover {
      background-color: rgba(0, 0, 0, 0.05);
    }
    
    .nav-item.active {
      background-color: rgba(63, 81, 181, 0.1);
      color: #3f51b5;
      font-weight: 500;
    }
    
    .main-content {
      flex: 1;
      overflow-y: auto;
      background-color: #fafafa;
    }
    
    .main-container {
      padding: 1.5rem;
      max-width: 1200px;
      margin: 0 auto;
    }
    
    .dashboard-grid {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }
    
    .stats-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 1rem;
    }
    
    .details-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(450px, 1fr));
      gap: 1.5rem;
    }
    
    .dashboard-card {
      background-color: white;
      border-radius: 8px;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
    }
    
    .stat-content {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 0.5rem;
    }
    
    .stat-icon {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background-color: rgba(63, 81, 181, 0.1);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .stat-icon mat-icon {
      color: #3f51b5;
    }
    
    .stat-info h3 {
      margin: 0 0 0.25rem;
      font-size: 1.5rem;
      font-weight: 600;
    }
    
    .stat-info p {
      margin: 0;
      color: rgba(0, 0, 0, 0.6);
    }
    
    .activity-item {
      display: flex;
      gap: 1rem;
      padding: 0.75rem 0;
      border-bottom: 1px solid rgba(0, 0, 0, 0.05);
    }
    
    .activity-icon {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background-color: rgba(63, 81, 181, 0.1);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .activity-icon mat-icon {
      font-size: 20px;
      color: #3f51b5;
    }
    
    .activity-details {
      flex: 1;
    }
    
    .activity-title {
      margin: 0;
      font-weight: 500;
    }
    
    .activity-time {
      margin: 0.25rem 0 0;
      font-size: 0.85rem;
      color: rgba(0, 0, 0, 0.6);
    }
    
    .shifts-table {
      width: 100%;
      border-collapse: collapse;
    }
    
    .shifts-table th, .shifts-table td {
      padding: 0.75rem;
      text-align: left;
      border-bottom: 1px solid rgba(0, 0, 0, 0.1);
    }
    
    .shifts-table th {
      font-weight: 500;
      color: rgba(0, 0, 0, 0.6);
    }
    
    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      margin: 2rem 0;
    }
    
    .loading-container p {
      margin-top: 1rem;
      color: rgba(0, 0, 0, 0.6);
    }
    
    .error-message {
      color: #f44336;
      background-color: rgba(244, 67, 54, 0.1);
      padding: 12px;
      border-radius: 4px;
      margin-bottom: 16px;
      border-left: 4px solid #f44336;
    }
    
    .debug-info {
      font-size: 12px;
      color: #666;
      padding: 6px 10px;
      margin: 4px 0;
      background-color: #f0f0f0;
      border-radius: 4px;
    }
  `]
})
export class DashboardComponent implements OnInit, OnDestroy {
  user: UserWithPermissions | null = null;
  userRole: string = '';
  isLoading: boolean = true;
  error: string = '';
  
  // Additional flag for admin role
  isAdmin: boolean = false;
  
  // Permission flags for navbar
  canAccessUsers: boolean = false;
  canAccessRoles: boolean = false;
  canAccessStores: boolean = false;
  canAccessEmployees: boolean = false;
  canAccessHours: boolean = false;
  
  private userSubscription?: Subscription;
  
  constructor(
    public authService: AuthService,
    private router: Router
  ) {}
  
  ngOnInit(): void {
    this.isLoading = true;
    
    // Subscribe to user data
    this.userSubscription = this.authService.user$.subscribe({
      next: (user) => {
        this.user = user;
        console.log('User loaded:', user); // Debug log
        
        if (user) {
          // Get role name
          if (user.role && typeof user.role === 'object' && user.role.name) {
            this.userRole = user.role.name;
            this.isAdmin = this.userRole.toLowerCase() === 'admin';
          } else if (typeof user.role === 'string') {
            this.userRole = user.role;
            this.isAdmin = this.userRole.toLowerCase() === 'admin';
          }
          
          // Check email for admin (additional check)
          if (user.email === 'admin@example.com') {
            this.isAdmin = true;
          }
          
          console.log('User role:', this.userRole, 'Is Admin:', this.isAdmin); // Debug log
          
          // Set permission flags for nav items
          this.setPermissionFlags();
        } else {
          // If user is null, try to load user profile
          console.log('No user data, trying to load profile');
          this.authService.loadUserProfile().subscribe({
            next: (loadedUser) => {
              console.log('Profile loaded:', loadedUser);
            },
            error: (err) => {
              console.error('Failed to load profile:', err);
            }
          });
        }
        
        this.isLoading = false;
      },
      error: (error) => {
        this.error = error.message || 'Error loading user data';
        console.error('Error loading user data:', error);
        this.isLoading = false;
      }
    });
    
    // Force reload of user profile to ensure we have the latest data
    this.authService.loadUserProfile().subscribe();
  }
  
  ngOnDestroy(): void {
    // Clean up subscription
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
  }
  
  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
  
  /**
   * Set permission flags based on user permissions
   */
  private setPermissionFlags(): void {
    // If admin, grant access to all modules
    if (this.isAdmin) {
      this.canAccessUsers = true;
      this.canAccessRoles = true;
      this.canAccessStores = true;
      this.canAccessEmployees = true;
      this.canAccessHours = true;
      return;
    }
    
    // Check both formats for permissions to ensure backward compatibility
    // Standard format
    this.canAccessUsers = this.authService.hasPermission('users', 'read');
    this.canAccessRoles = this.authService.hasPermission('roles', 'read');
    this.canAccessStores = this.authService.hasPermission('stores', 'read');
    this.canAccessEmployees = this.authService.hasPermission('employees', 'read');
    this.canAccessHours = this.authService.hasPermission('hours', 'read');
    
    // Legacy format check - remove when no longer needed
    if (!this.canAccessUsers) this.canAccessUsers = this.authService.hasPermissionLegacy('users:read');
    if (!this.canAccessRoles) this.canAccessRoles = this.authService.hasPermissionLegacy('roles:read');
    if (!this.canAccessStores) this.canAccessStores = this.authService.hasPermissionLegacy('stores:read');
    if (!this.canAccessEmployees) this.canAccessEmployees = this.authService.hasPermissionLegacy('employees:read');
    if (!this.canAccessHours) this.canAccessHours = this.authService.hasPermissionLegacy('hours:read');
    
    console.log('Permission flags:', {
      users: this.canAccessUsers,
      roles: this.canAccessRoles,
      stores: this.canAccessStores,
      employees: this.canAccessEmployees,
      hours: this.canAccessHours
    });
  }
}