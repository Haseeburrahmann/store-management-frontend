// dashboard.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';

import { AuthService } from '../../core/auth/services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule],
  template: `
    <div class="dashboard-container">
      <!-- Header -->
      <header class="app-header">
        <div class="flex justify-between items-center">
          <h1>Store Management System</h1>
          <div class="flex items-center gap-4">
            <span *ngIf="user">{{ user.email }}</span>
            <button mat-icon-button (click)="logout()">
              <mat-icon>exit_to_app</mat-icon>
            </button>
          </div>
        </div>
      </header>
      
      <div class="flex content-area">
        <!-- Sidebar -->
        <aside class="app-sidebar">
          <div class="sidebar-content">
            <div class="user-info p-4">
              <h3 *ngIf="user">{{ user.full_name || 'User' }}</h3>
              <p *ngIf="user">{{ user.role }}</p>
            </div>
            
            <nav class="sidebar-nav">
              <a class="nav-item active">Dashboard</a>
              <a class="nav-item">Employees</a>
              <a class="nav-item">Hours Tracking</a>
              <a class="nav-item">Payments</a>
              <a class="nav-item">Inventory</a>
              <a class="nav-item">Sales</a>
              <a class="nav-item">Settings</a>
            </nav>
          </div>
        </aside>
        
        <!-- Main Content -->
        <main class="main-content">
          <div class="p-4">
            <h2>Dashboard</h2>
            
            <div class="dashboard-grid">
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
    }
    
    .content-area {
      flex: 1;
      overflow: hidden;
    }
    
    .app-sidebar {
      width: 250px;
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
    }
    
    .user-info h3 {
      margin: 0;
      font-size: 1.1rem;
    }
    
    .user-info p {
      margin: 0.25rem 0 0;
      opacity: 0.7;
      font-size: 0.9rem;
    }
    
    .sidebar-nav {
      flex: 1;
      padding: 1rem 0;
    }
    
    .nav-item {
      display: block;
      padding: 0.75rem 1.5rem;
      margin: 0.25rem 0;
      color: inherit;
      text-decoration: none;
      border-radius: 0 24px 24px 0;
      transition: all 0.2s ease;
      cursor: pointer;
    }
    
    .nav-item:hover {
      background-color: rgba(0, 0, 0, 0.05);
    }
    
    .nav-item.active {
      background-color: rgba(57, 73, 171, 0.1);
      color: var(--primary-color);
      font-weight: 500;
    }
    
    .main-content {
      flex: 1;
      overflow-y: auto;
      padding: 1rem;
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
    
    .stat-content {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    
    .stat-icon {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background-color: rgba(57, 73, 171, 0.1);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .stat-icon mat-icon {
      color: var(--primary-color);
    }
    
    .stat-info h3 {
      margin: 0 0 0.25rem;
      font-size: 1.5rem;
      font-weight: 600;
    }
    
    .stat-info p {
      margin: 0;
      opacity: 0.7;
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
      background-color: rgba(57, 73, 171, 0.1);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .activity-icon mat-icon {
      font-size: 20px;
      color: var(--primary-color);
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
      opacity: 0.7;
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
      opacity: 0.7;
    }
  `]
})
export class DashboardComponent {
  user: any;
  
  constructor(
    private authService: AuthService,
    private router: Router
  ) {
    this.authService.currentUser$.subscribe(user => {
      this.user = user;
    });
  }
  
  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}