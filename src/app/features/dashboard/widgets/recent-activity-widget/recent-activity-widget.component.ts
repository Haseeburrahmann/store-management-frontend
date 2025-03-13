// src/app/features/dashboard/widgets/recent-activity-widget/recent-activity-widget.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/auth/auth.service';
import { PermissionService } from '../../../../core/auth/permission.service';

interface ActivityItem {
  id: string;
  type: 'timesheet' | 'schedule' | 'employee' | 'store' | 'clock' | 'payment';
  action: string;
  details: string;
  timestamp: Date;
  user: string;
  location?: string;
  status?: string;
}

@Component({
  selector: 'app-recent-activity-widget',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-hidden mb-6">
      <div class="px-6 py-5 border-b border-slate-200 dark:border-slate-700">
        <h3 class="text-lg font-medium leading-6 text-slate-900 dark:text-white">Recent Activity</h3>
      </div>
      <div *ngIf="loading" class="flex justify-center py-4">
        <div class="w-6 h-6 border-2 border-t-2 border-primary-500 rounded-full animate-spin"></div>
      </div>
      <ul *ngIf="!loading" class="divide-y divide-slate-200 dark:divide-slate-700">
        <li *ngFor="let item of filteredActivities" class="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors duration-150">
          <div class="px-6 py-4">
            <div class="flex items-center justify-between">
              <div class="min-w-0 flex-1">
                <p class="text-sm font-medium text-slate-900 dark:text-white truncate">
                  {{ item.user }} {{ item.action }}
                </p>
                <p class="text-sm text-slate-500 dark:text-slate-400">
                  {{ formatTime(item.timestamp) }} {{ item.location ? '• ' + item.location : '' }}
                </p>
                <p *ngIf="item.details" class="text-sm text-slate-600 dark:text-slate-300 mt-1">
                  {{ item.details }}
                </p>
              </div>
              <div *ngIf="item.status">
                <div 
                  class="ml-4 flex-shrink-0 inline-flex text-xs leading-5 font-semibold rounded-full px-2 py-1"
                  [ngClass]="{
                    'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200': item.status === 'on time' || item.status === 'approved',
                    'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200': item.status === 'pending' || item.status === 'late',
                    'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200': item.status === 'rejected',
                    'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200': item.status === 'info'
                  }">
                  {{ item.status }}
                </div>
              </div>
            </div>
          </div>
        </li>
      </ul>
      <div class="bg-slate-50 dark:bg-slate-700 px-6 py-3">
        <div class="text-sm">
          <a routerLink="/activity" class="font-medium text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white">View all activity</a>
        </div>
      </div>
    </div>
  `
})
export class RecentActivityWidgetComponent implements OnInit {
  loading = true;
  activities: ActivityItem[] = [];
  isAdmin = false;
  isManager = false;
  
  // Show only relevant activities based on user role
  get filteredActivities(): ActivityItem[] {
    // Admin and managers see all activities
    if (this.isAdmin || this.isManager) {
      return this.activities.slice(0, 5); // Show only first 5
    }
    
    // Employees only see activities relevant to them
    return this.activities
      .filter(item => {
        // Add logic to filter activities for employee view
        // This is a simplified example - in a real app you would check
        // if the activity belongs to the current user or their store
        return true;
      })
      .slice(0, 5); // Show only first 5
  }
  
  constructor(
    private authService: AuthService,
    private permissionService: PermissionService
  ) {}
  
  ngOnInit(): void {
    // Determine user role
    this.isAdmin = this.permissionService.isAdmin();
    this.isManager = this.permissionService.isManager();
    
    // Load activities
    this.loadActivities();
  }
  
  loadActivities(): void {
    // In a real app, this would be an API call
    // For now, we'll just use sample data
    this.activities = this.getSampleActivities();
    
    // Simulate loading delay
    setTimeout(() => {
      this.loading = false;
    }, 800);
  }
  
  getSampleActivities(): ActivityItem[] {
    return [
      {
        id: '1',
        type: 'clock',
        action: 'clocked in',
        details: '',
        timestamp: new Date(new Date().setHours(8, 3, 0, 0)),
        user: 'Jane Smith',
        location: 'Downtown Store',
        status: 'on time'
      },
      {
        id: '2',
        type: 'timesheet',
        action: 'submitted timesheet for approval',
        details: 'Total hours: 8.5',
        timestamp: new Date(new Date().setDate(new Date().getDate() - 1)),
        user: 'John Doe',
        status: 'pending'
      },
      {
        id: '3',
        type: 'employee',
        action: 'was assigned to Eastside Store',
        details: '',
        timestamp: new Date(new Date().setDate(new Date().getDate() - 2)),
        user: 'Robert Johnson'
      },
      {
        id: '4',
        type: 'timesheet',
        action: 'approved timesheet',
        details: 'Week of March 1-7, 2025',
        timestamp: new Date(new Date().setDate(new Date().getDate() - 3)),
        user: 'Maria Garcia',
        status: 'approved'
      },
      {
        id: '5',
        type: 'schedule',
        action: 'created new schedule',
        details: 'Week of March 10-16, 2025',
        timestamp: new Date(new Date().setDate(new Date().getDate() - 3)),
        user: 'Thomas Wilson',
        location: 'North Point'
      },
      {
        id: '6',
        type: 'store',
        action: 'updated store information',
        details: 'Updated operating hours and contact information',
        timestamp: new Date(new Date().setDate(new Date().getDate() - 4)),
        user: 'Admin',
        location: 'West Mall'
      },
      {
        id: '7',
        type: 'payment',
        action: 'processed payroll',
        details: 'Total: $12,450.75 for 15 employees',
        timestamp: new Date(new Date().setDate(new Date().getDate() - 5)),
        user: 'Admin',
        status: 'approved'
      }
    ];
  }
  
  formatTime(date: Date): string {
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) {
      // Today
      return `Today at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffInDays === 1) {
      // Yesterday
      return `Yesterday at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffInDays < 7) {
      // Within a week
      return `${diffInDays} days ago`;
    } else {
      // Older than a week
      return date.toLocaleDateString();
    }
  }
}