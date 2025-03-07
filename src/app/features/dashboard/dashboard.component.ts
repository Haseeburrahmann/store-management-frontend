// src/app/features/dashboard/dashboard.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { AuthService } from '../../core/services/auth.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { CardContainerComponent } from '../../shared/components/card-container/card-container.component';
import { Observable, map } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatIconModule,
    MatButtonModule,
    MatTabsModule,
    MatProgressBarModule,
    PageHeaderComponent,
    CardContainerComponent
  ],
  templateUrl: './dashboard.component.html',
  styles: [`
    .dashboard-content {
      margin-top: 16px;
    }
    
    .stats-row {
      margin-bottom: 24px;
    }
    
    .stat-card {
      padding: 8px;
      text-align: center;
    }
    
    .stat-value {
      font-size: 28px;
      font-weight: 500;
      margin-bottom: 4px;
    }
    
    .stat-subtitle {
      font-size: 14px;
      color: rgba(0, 0, 0, 0.6);
    }
    
    .stat-details {
      margin-top: 8px;
      font-size: 12px;
      color: rgba(0, 0, 0, 0.6);
    }
    
    .stat-change {
      font-size: 14px;
      margin-top: 4px;
      font-weight: 500;
    }
    
    .stat-change.positive {
      color: var(--app-success);
    }
    
    .stat-change.negative {
      color: var(--app-error);
    }
    
    .status-list, .activity-list, .schedule-list, .inventory-status, .sales-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    
    .status-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 0;
      border-bottom: 1px solid rgba(0, 0, 0, 0.08);
    }
    
    .status-label {
      font-weight: 500;
    }
    
    .status-value {
      display: flex;
      align-items: center;
      gap: 4px;
    }
    
    .activity-item {
      display: flex;
      gap: 16px;
      padding: 8px 0;
      border-bottom: 1px solid rgba(0, 0, 0, 0.08);
    }
    
    .activity-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      flex-shrink: 0;
    }
    
    .activity-icon mat-icon {
      color: white;
    }
    
    .activity-content {
      flex: 1;
    }
    
    .activity-title {
      font-weight: 500;
    }
    
    .activity-subtitle {
      font-size: 14px;
      margin-top: 2px;
    }
    
    .activity-time {
      font-size: 12px;
      color: rgba(0, 0, 0, 0.6);
      margin-top: 4px;
    }
    
    .schedule-item {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 12px 0;
      border-bottom: 1px solid rgba(0, 0, 0, 0.08);
    }
    
    .employee-avatar {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background-color: var(--app-primary);
      color: white;
      font-weight: 500;
      flex-shrink: 0;
    }
    
    .employee-info {
      flex: 1;
    }
    
    .employee-name {
      font-weight: 500;
    }
    
    .shift-time {
      font-size: 14px;
      color: rgba(0, 0, 0, 0.8);
    }
    
    .shift-status {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 14px;
    }
    
    .shift-status.upcoming {
      color: var(--app-info);
    }
    
    .inventory-item {
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding: 8px 0;
      border-bottom: 1px solid rgba(0, 0, 0, 0.08);
    }
    
    .item-info {
      display: flex;
      justify-content: space-between;
    }
    
    .item-name {
      font-weight: 500;
    }
    
    .item-quantity {
      font-size: 14px;
    }
    
    .item-progress {
      position: relative;
      padding-top: 4px;
    }
    
    .inventory-label {
      position: absolute;
      right: 0;
      top: 4px;
      font-size: 12px;
      font-weight: 500;
    }
    
    .inventory-label.low {
      color: var(--app-error);
    }
    
    .inventory-label.medium {
      color: var(--app-warning);
    }
    
    .inventory-label.good {
      color: var(--app-success);
    }
    
    .sale-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 0;
      border-bottom: 1px solid rgba(0, 0, 0, 0.08);
    }
    
    .sale-time {
      font-weight: 500;
    }
    
    .sale-items {
      font-size: 14px;
      color: rgba(0, 0, 0, 0.6);
    }
    
    .sale-total {
      font-weight: 500;
      font-size: 16px;
    }
    
    .schedule-week {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    
    .schedule-day {
      display: flex;
      flex-direction: column;
      border-bottom: 1px solid rgba(0, 0, 0, 0.08);
      padding: 8px 0;
    }
    
    .day-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 4px;
    }
    
    .day-header.today {
      color: var(--app-primary);
      font-weight: 500;
    }
    
    .day-name {
      font-weight: 500;
    }
    
    .day-date {
      font-size: 14px;
    }
    
    .day-schedule {
      display: flex;
      flex-direction: column;
    }
    
    .quick-actions {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
      padding: 8px 0;
    }
    
    .quick-action-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 16px;
      border-radius: 8px;
      background-color: rgba(0, 0, 0, 0.03);
      text-decoration: none;
      color: inherit;
      transition: background-color 0.2s;
    }
    
    .quick-action-card:hover {
      background-color: rgba(0, 0, 0, 0.06);
    }
    
    .quick-action-card mat-icon {
      color: var(--app-primary);
    }
    
    :host-context(.dark-theme) {
      .stat-subtitle, 
      .stat-details, 
      .activity-time, 
      .sale-items {
        color: rgba(255, 255, 255, 0.7);
      }
      
      .status-item, 
      .activity-item, 
      .schedule-item, 
      .inventory-item, 
      .sale-item, 
      .schedule-day {
        border-bottom-color: rgba(255, 255, 255, 0.1);
      }
      
      .quick-action-card {
        background-color: rgba(255, 255, 255, 0.05);
      }
      
      .quick-action-card:hover {
        background-color: rgba(255, 255, 255, 0.1);
      }
    }
  `]
})
export class DashboardComponent implements OnInit {
  // User data
  currentUser$ = this.authService.user$;
  userRole$ = this.authService.user$.pipe(
    map(user => user?.role?.name || 'Employee')
  );
  
  // Admin dashboard data
  userStats = {
    total: 85,
    change: 5.2
  };
  
  storeStats = {
    total: 12,
    change: 0
  };
  
  salesStats = {
    value: 128456.75,
    change: 8.3
  };
  
  inventoryStats = {
    total: 1245,
    change: -2.1
  };
  
  // Manager dashboard data
  employeeStats = {
    total: 8,
    active: 5
  };
  
  pendingApprovals = {
    total: 3,
    urgent: 1
  };
  
  todaySales = {
    value: 1850.45,
    transactions: 23
  };
  
  stockRequests = {
    total: 5,
    pending: 2
  };
  
  // Employee dashboard data
  employeeHours = {
    today: 5,
    week: 23
  };
  
  employeeSales = {
    today: 523.45
  };
  
  employeeRequests = {
    pending: 1
  };
  
  constructor(
    private authService: AuthService
  ) {}
  
  ngOnInit(): void {
    // In a real application, we would load this data from services
  }
  
  formatNumber(value: number): string {
    return value.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }
}