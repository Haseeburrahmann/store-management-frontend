// src/app/features/dashboard/dashboard.component.ts

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router, RouterModule } from '@angular/router';
import { Store } from '../../shared/models/store.model';
import { Employee } from '../../shared/models/employee.model';
import { calculateHours, Hours, HoursStatus } from '../../shared/models/hours.model';
import { StoreService } from '../../core/services/store.service';
import { EmployeeService } from '../../core/services/employee.service';
import { HoursService } from '../../core/services/hours.service';
import { AuthService } from '../../core/services/auth.service';
import { UserWithPermissions } from '../../core/auth/models/user.model';
import { Subscription, forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

interface Activity {
  type: 'login' | 'hours' | 'employee' | 'store' | 'inventory' | 'sales';
  description: string;
  timestamp: Date;
  user?: string;
}

interface InventoryAlert {
  severity: 'low' | 'critical' | 'reorder';
  message: string;
  item_id: string;
  item_name: string;
  quantity: number;
}

interface ScheduleShift {
  date: Date;
  start_time: Date;
  end_time: Date;
  employees?: { name: string; status: string }[];
}

interface WeekDay {
  name: string;
  date: Date;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatSnackBarModule,
    MatTableModule,
    MatTooltipModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {
  // User information
  currentUser: UserWithPermissions | null = null;
  isAdmin = false;
  isManager = false;
  isEmployee = false;
  
  // Dashboard data
  stores: Store[] = [];
  employees: Employee[] = [];
  pendingHours: Hours[] = [];
  recentActivity: Activity[] = [];
  inventoryAlerts: InventoryAlert[] = [];
  todaySchedule: ScheduleShift[] = [];
  upcomingSchedule: ScheduleShift[] = [];
  weeklyHours: Hours[] = [];
  weekDays: WeekDay[] = [];

  // Employee-specific data
  clockedIn = false;
  clockInTime: Date | null = null;
  
  // Loading states
  isLoadingStores = false;
  isLoadingEmployees = false;
  isLoadingHours = false;
  isLoadingActivity = false;
  isLoadingInventory = false;
  isLoadingSchedule = false;
  isLoadingWeeklyHours = false;
  
  // Error states
  storesError = '';
  employeesError = '';
  hoursError = '';
  activityError = '';
  inventoryError = '';
  scheduleError = '';
  weeklyHoursError = '';
  
  // Stats
  totalStores = 0;
  totalEmployees = 0;
  totalPendingHours = 0;
  totalSales = 0;
  totalWeeklyHours = 0;
  
  private subscriptions: Subscription[] = [];
  
  constructor(
    private storeService: StoreService,
    private employeeService: EmployeeService,
    private hoursService: HoursService,
    private authService: AuthService,
    private snackBar: MatSnackBar,
    private router: Router
  ) {
    this.initializeWeekDays();
  }

  ngOnInit(): void {
    this.checkUserRole();
  }
  
  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  private checkUserRole(): void {
    const userSub = this.authService.user$.subscribe(user => {
      this.currentUser = user;
      
      if (user) {
        // Check permissions
        this.isAdmin = this.authService.hasPermission('users', 'approve');
        this.isManager = !this.isAdmin && this.authService.hasPermission('employees', 'approve');
        this.isEmployee = !this.isAdmin && !this.isManager && this.authService.hasPermission('hours', 'write');
        
        // Load data based on role
        this.loadDashboardData();
      }
    });
    
    this.subscriptions.push(userSub);
  }

  private loadDashboardData(): void {
    if (this.isAdmin) {
      this.loadAdminDashboard();
    } else if (this.isManager) {
      this.loadManagerDashboard();
    } else {
      this.loadEmployeeDashboard();
    }
  }

  private loadAdminDashboard(): void {
    this.loadStores();
    this.loadEmployees();
    this.loadPendingHours();
    this.loadRecentActivity();
  }

  private loadManagerDashboard(): void {
    // Get managed store ID (assuming it's stored in user object)
    const managedStoreId = (this.currentUser as any).managed_store_id;
    
    if (managedStoreId) {
      this.loadStoreById(managedStoreId);
      this.loadEmployeesByStore(managedStoreId);
      this.loadPendingHoursByStore(managedStoreId);
      this.loadTodaySchedule(managedStoreId);
      this.loadInventoryAlerts(managedStoreId);
      this.loadTodaySales(managedStoreId);
    } else {
      this.snackBar.open('No managed store found. Please contact an administrator.', 'Close', { duration: 5000 });
    }
  }

  private loadEmployeeDashboard(): void {
    if (this.currentUser) {
      const userId = this.currentUser._id;
      this.loadEmployeeData(userId);
      this.loadWeeklyHours(userId);
      this.loadEmployeeSchedule(userId);
      this.checkClockStatus(userId);
    }
  }

  private loadStores(): void {
    this.isLoadingStores = true;
    this.storesError = '';
    
    const storesSub = this.storeService.getStores()
      .pipe(
        catchError(error => {
          this.storesError = error.message || 'Error loading stores';
          console.error('Error loading stores:', error);
          return of([]);
        })
      )
      .subscribe(stores => {
        this.stores = stores;
        this.totalStores = stores.length;
        this.isLoadingStores = false;
      });
    
    this.subscriptions.push(storesSub);
  }

  private loadStoreById(storeId: string): void {
    this.isLoadingStores = true;
    this.storesError = '';
    
    const storeSub = this.storeService.getStore(storeId)
      .pipe(
        catchError(error => {
          this.storesError = error.message || `Error loading store with ID ${storeId}`;
          console.error(`Error loading store with ID ${storeId}:`, error);
          return of(null);
        })
      )
      .subscribe(store => {
        if (store) {
          this.stores = [store];
          this.totalStores = 1;
        }
        this.isLoadingStores = false;
      });
    
    this.subscriptions.push(storeSub);
  }

  private loadEmployees(): void {
    this.isLoadingEmployees = true;
    this.employeesError = '';
    
    const employeesSub = this.employeeService.getEmployees()
      .pipe(
        catchError(error => {
          this.employeesError = error.message || 'Error loading employees';
          console.error('Error loading employees:', error);
          return of([]);
        })
      )
      .subscribe(employees => {
        this.employees = employees;
        this.totalEmployees = employees.length;
        this.isLoadingEmployees = false;
      });
    
    this.subscriptions.push(employeesSub);
  }

  private loadEmployeesByStore(storeId: string): void {
    this.isLoadingEmployees = true;
    this.employeesError = '';
    
    const employeesSub = this.employeeService.getEmployees(0, 100, storeId)
      .pipe(
        catchError(error => {
          this.employeesError = error.message || `Error loading employees for store ${storeId}`;
          console.error(`Error loading employees for store ${storeId}:`, error);
          return of([]);
        })
      )
      .subscribe(employees => {
        this.employees = employees;
        this.totalEmployees = employees.length;
        this.isLoadingEmployees = false;
      });
    
    this.subscriptions.push(employeesSub);
  }

  private loadEmployeeData(userId: string): void {
    // This would find the employee record associated with the user
    // For demo purposes, we'll simulate some data
    this.isLoadingEmployees = true;
    
    // In a real implementation, you would call the API to get employee data
    setTimeout(() => {
      this.isLoadingEmployees = false;
    }, 1000);
  }

  private loadPendingHours(): void {
    this.isLoadingHours = true;
    this.hoursError = '';
    
    const hoursSub = this.hoursService.getPendingApprovals()
      .pipe(
        catchError(error => {
          this.hoursError = error.message || 'Error loading pending hours';
          console.error('Error loading pending hours:', error);
          return of([]);
        })
      )
      .subscribe(hours => {
        this.pendingHours = hours;
        this.totalPendingHours = hours.length;
        this.isLoadingHours = false;
      });
    
    this.subscriptions.push(hoursSub);
  }

  private loadPendingHoursByStore(storeId: string): void {
    this.isLoadingHours = true;
    this.hoursError = '';
    
    const hoursSub = this.hoursService.getStoreHours(storeId, undefined, undefined, HoursStatus.PENDING)
      .pipe(
        catchError(error => {
          this.hoursError = error.message || `Error loading pending hours for store ${storeId}`;
          console.error(`Error loading pending hours for store ${storeId}:`, error);
          return of([]);
        })
      )
      .subscribe(hours => {
        this.pendingHours = hours;
        this.totalPendingHours = hours.length;
        this.isLoadingHours = false;
      });
    
    this.subscriptions.push(hoursSub);
  }

  private loadRecentActivity(): void {
    this.isLoadingActivity = true;
    this.activityError = '';
    
    // In a real implementation, you would call the API to get activity data
    // For demo purposes, we'll simulate some data
    setTimeout(() => {
      this.recentActivity = [
        {
          type: 'login',
          description: 'John Smith logged in',
          timestamp: new Date(Date.now() - 15 * 60000) // 15 minutes ago
        },
        {
          type: 'hours',
          description: 'Sarah Johnson submitted hours for approval',
          timestamp: new Date(Date.now() - 45 * 60000) // 45 minutes ago
        },
        {
          type: 'employee',
          description: 'New employee Tom Wilson added',
          timestamp: new Date(Date.now() - 120 * 60000) // 2 hours ago
        },
        {
          type: 'store',
          description: 'Downtown store inventory updated',
          timestamp: new Date(Date.now() - 180 * 60000) // 3 hours ago
        },
        {
          type: 'sales',
          description: 'Westside store reported $1,240 in sales',
          timestamp: new Date(Date.now() - 240 * 60000) // 4 hours ago
        }
      ];
      this.isLoadingActivity = false;
    }, 1000);
  }

  private loadTodaySchedule(storeId: string): void {
    this.isLoadingSchedule = true;
    this.scheduleError = '';
    
    // In a real implementation, you would call the API to get schedule data
    // For demo purposes, we'll simulate some data
    setTimeout(() => {
      this.todaySchedule = [
        {
          date: new Date(),
          start_time: new Date(new Date().setHours(9, 0, 0, 0)),
          end_time: new Date(new Date().setHours(13, 0, 0, 0)),
          employees: [
            { name: 'John Smith', status: 'active' },
            { name: 'Sarah Johnson', status: 'active' }
          ]
        },
        {
          date: new Date(),
          start_time: new Date(new Date().setHours(13, 0, 0, 0)),
          end_time: new Date(new Date().setHours(17, 0, 0, 0)),
          employees: [
            { name: 'Mark Brown', status: 'active' },
            { name: 'Lisa Davis', status: 'on_leave' }
          ]
        },
        {
          date: new Date(),
          start_time: new Date(new Date().setHours(17, 0, 0, 0)),
          end_time: new Date(new Date().setHours(21, 0, 0, 0)),
          employees: [
            { name: 'Alex Wilson', status: 'active' },
            { name: 'Jamie Taylor', status: 'active' }
          ]
        }
      ];
      this.isLoadingSchedule = false;
    }, 1000);
  }

  private loadInventoryAlerts(storeId: string): void {
    this.isLoadingInventory = true;
    this.inventoryError = '';
    
    // In a real implementation, you would call the API to get inventory data
    // For demo purposes, we'll simulate some data
    setTimeout(() => {
      this.inventoryAlerts = [
        {
          severity: 'low',
          message: 'Low stock: Item A',
          item_id: '1',
          item_name: 'Product A',
          quantity: 5
        },
        {
          severity: 'critical',
          message: 'Critical stock: Item B',
          item_id: '2',
          item_name: 'Product B',
          quantity: 1
        },
        {
          severity: 'reorder',
          message: 'Reorder: Item C',
          item_id: '3',
          item_name: 'Product C',
          quantity: 10
        }
      ];
      this.isLoadingInventory = false;
    }, 1000);
  }

  private loadTodaySales(storeId: string): void {
    // In a real implementation, you would call the API to get sales data
    // For demo purposes, we'll simulate some data
    this.totalSales = 5200;
  }

  private loadWeeklyHours(userId: string): void {
    this.isLoadingWeeklyHours = true;
    this.weeklyHoursError = '';
    
    // In a real implementation, you would call the API to get hours data
    // For demo purposes, we'll simulate some data
    setTimeout(() => {
      // Create sample hours for this week
      const today = new Date();
      const mondayDate = this.getMonday(today);
      
      this.weeklyHours = [
        {
          _id: '1',
          employee_id: userId,
          store_id: '1', // Default store ID
          employee: { _id: userId, full_name: this.currentUser?.full_name || 'Employee' } as Employee,
          date: new Date(mondayDate.getTime()).toISOString(),
          clock_in: new Date(new Date(mondayDate.getTime()).setHours(9, 0, 0, 0)).toISOString(),
          clock_out: new Date(new Date(mondayDate.getTime()).setHours(17, 0, 0, 0)).toISOString(),
          total_hours: 8,
          status: HoursStatus.APPROVED,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          _id: '2',
          employee_id: userId,
          store_id: '1', // Default store ID
          employee: { _id: userId, full_name: this.currentUser?.full_name || 'Employee' } as Employee,
          date: new Date(mondayDate.getTime() + 24 * 60 * 60 * 1000).toISOString(), // Tuesday
          clock_in: new Date(new Date(mondayDate.getTime() + 24 * 60 * 60 * 1000).setHours(9, 0, 0, 0)).toISOString(),
          clock_out: new Date(new Date(mondayDate.getTime() + 24 * 60 * 60 * 1000).setHours(16, 30, 0, 0)).toISOString(),
          total_hours: 7.5,
          status: HoursStatus.APPROVED,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          _id: '3',
          employee_id: userId,
          store_id: '1', // Default store ID
          employee: { _id: userId, full_name: this.currentUser?.full_name || 'Employee' } as Employee,
          date: new Date(mondayDate.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(), // Thursday
          clock_in: new Date(new Date(mondayDate.getTime() + 3 * 24 * 60 * 60 * 1000).setHours(9, 0, 0, 0)).toISOString(),
          clock_out: new Date(new Date(mondayDate.getTime() + 3 * 24 * 60 * 60 * 1000).setHours(17, 0, 0, 0)).toISOString(),
          total_hours: 8,
          status: HoursStatus.PENDING,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          _id: '4',
          employee_id: userId,
          store_id: '1', // Default store ID
          employee: { _id: userId, full_name: this.currentUser?.full_name || 'Employee' } as Employee,
          date: new Date(mondayDate.getTime() + 4 * 24 * 60 * 60 * 1000).toISOString(), // Friday
          clock_in: new Date(new Date(mondayDate.getTime() + 4 * 24 * 60 * 60 * 1000).setHours(9, 0, 0, 0)).toISOString(),
          clock_out: new Date(new Date(mondayDate.getTime() + 4 * 24 * 60 * 60 * 1000).setHours(17, 0, 0, 0)).toISOString(),
          total_hours: 8,
          status: HoursStatus.PENDING,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];
      
      this.totalWeeklyHours = this.weeklyHours.reduce((sum, hour) => sum + (hour.total_hours || 0), 0);
      this.isLoadingWeeklyHours = false;
    }, 1000);
  }

  private loadEmployeeSchedule(userId: string): void {
    this.isLoadingSchedule = true;
    this.scheduleError = '';
    
    // In a real implementation, you would call the API to get schedule data
    // For demo purposes, we'll simulate some data
    setTimeout(() => {
      const today = new Date();
      
      this.upcomingSchedule = [
        {
          date: new Date(today.getTime() + 24 * 60 * 60 * 1000), // Tomorrow
          start_time: new Date(new Date(today.getTime() + 24 * 60 * 60 * 1000).setHours(9, 0, 0, 0)),
          end_time: new Date(new Date(today.getTime() + 24 * 60 * 60 * 1000).setHours(17, 0, 0, 0))
        },
        {
          date: new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000), // Day after tomorrow
          start_time: new Date(new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000).setHours(13, 0, 0, 0)),
          end_time: new Date(new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000).setHours(21, 0, 0, 0))
        },
        {
          date: new Date(today.getTime() + 4 * 24 * 60 * 60 * 1000), // 4 days from now
          start_time: new Date(new Date(today.getTime() + 4 * 24 * 60 * 60 * 1000).setHours(10, 0, 0, 0)),
          end_time: new Date(new Date(today.getTime() + 4 * 24 * 60 * 60 * 1000).setHours(18, 0, 0, 0))
        }
      ];
      
      this.isLoadingSchedule = false;
    }, 1000);
  }

  private checkClockStatus(userId: string): void {
    // In a real implementation, you would call the API to check if user is clocked in
    // For demo purposes, we'll simulate some data
    const randomClockIn = Math.random() > 0.5;
    this.clockedIn = randomClockIn;
    
    if (randomClockIn) {
      // Simulate clocked in about 3 hours ago
      this.clockInTime = new Date(Date.now() - 3 * 60 * 60 * 1000);
    } else {
      this.clockInTime = null;
    }
  }

  private initializeWeekDays(): void {
    const today = new Date();
    const mondayDate = this.getMonday(today);
    
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    
    this.weekDays = days.map((day, index) => {
      const date = new Date(mondayDate.getTime() + index * 24 * 60 * 60 * 1000);
      return { name: day, date };
    });
  }

  private getMonday(date: Date): Date {
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    return new Date(date.setDate(diff));
  }

  // Helper Methods
  getActivityIcon(type: string): string {
    switch (type) {
      case 'login':
        return 'login';
      case 'hours':
        return 'schedule';
      case 'employee':
        return 'person';
      case 'store':
        return 'store';
      case 'inventory':
        return 'inventory';
      case 'sales':
        return 'attach_money';
      default:
        return 'info';
    }
  }

  getAlertIcon(severity: string): string {
    switch (severity) {
      case 'low':
        return 'warning';
      case 'critical':
        return 'error';
      case 'reorder':
        return 'shopping_cart';
      default:
        return 'info';
    }
  }

  getDurationString(hour: Hours): string {
    if (!hour.clock_in || !hour.clock_out) return '';
    
    const clockIn = new Date(hour.clock_in);
    const clockOut = new Date(hour.clock_out);
    
    return `${hour.total_hours || calculateHours(hour.clock_in, hour.clock_out)} hrs`;
  }
  
  calculateHours(start: string, end: string): number {
    try {
      const startDate = new Date(start);
      const endDate = new Date(end);
      
      // Calculate difference in milliseconds
      const diffMs = endDate.getTime() - startDate.getTime();
      
      // Convert to hours with 2 decimal places
      return parseFloat((diffMs / (1000 * 60 * 60)).toFixed(1));
    } catch (error) {
      console.error('Error calculating hours:', error);
      return 0;
    }
  }

  getEmployeeInitials(employee: Employee): string {
    if (!employee.full_name) return '';
    
    const names = employee.full_name.split(' ');
    if (names.length >= 2) {
      return (names[0][0] + names[1][0]).toUpperCase();
    } else if (names.length === 1) {
      return names[0][0].toUpperCase();
    }
    
    return '';
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

  getGreetingMessage(): string {
    const hour = new Date().getHours();
    
    if (hour < 12) {
      return 'Good morning! Here\'s your day at a glance.';
    } else if (hour < 17) {
      return 'Good afternoon! Here\'s your day at a glance.';
    } else {
      return 'Good evening! Here\'s your day at a glance.';
    }
  }

  getHoursForDay(date: Date): Hours | undefined {
    return this.weeklyHours.find(hour => {
      const hourDate = new Date(hour.date);
      return hourDate.getDate() === date.getDate() && 
             hourDate.getMonth() === date.getMonth() && 
             hourDate.getFullYear() === date.getFullYear();
    });
  }

  getStatusClass(status?: HoursStatus): string {
    if (!status) return '';
    
    switch (status) {
      case HoursStatus.APPROVED:
        return 'status-approved';
      case HoursStatus.PENDING:
        return 'status-pending';
      case HoursStatus.REJECTED:
        return 'status-rejected';
      default:
        return '';
    }
  }

  getShiftHours(shift: ScheduleShift): number {
    if (!shift.start_time || !shift.end_time) return 0;
    
    const start = new Date(shift.start_time);
    const end = new Date(shift.end_time);
    
    return (end.getTime() - start.getTime()) / (1000 * 60 * 60);
  }

  isToday(date: Date): boolean {
    const today = new Date();
    return date.getDate() === today.getDate() && 
           date.getMonth() === today.getMonth() && 
           date.getFullYear() === today.getFullYear();
  }

  // Action Methods
  navigateToStores(): void {
    this.router.navigate(['/stores']);
  }

  navigateToEmployees(): void {
    this.router.navigate(['/employees']);
  }

  navigateToHours(): void {
    this.router.navigate(['/hours']);
  }

  navigateToHoursApproval(): void {
    this.router.navigate(['/hours/approvals']);
  }

  navigateToReports(): void {
    this.router.navigate(['/reports']);
  }

  navigateToProfile(): void {
    this.router.navigate(['/profile']);
  }

  navigateToSales(): void {
    this.router.navigate(['/sales']);
  }

  navigateToInventory(): void {
    this.router.navigate(['/inventory']);
  }

  navigateToSchedule(): void {
    this.router.navigate(['/schedule']);
  }

  navigateToRequests(): void {
    this.router.navigate(['/requests']);
  }

  navigateToPayment(): void {
    this.router.navigate(['/payments']);
  }

  approveHours(hour: Hours): void {
    this.snackBar.open('Hours approved successfully', 'Close', { duration: 3000 });
    // In a real implementation, you would call the API to approve hours
  }

  rejectHours(hour: Hours): void {
    this.snackBar.open('Hours rejected', 'Close', { duration: 3000 });
    // In a real implementation, you would call the API to reject hours
  }

  createStockRequest(itemId: string): void {
    this.snackBar.open('Stock request created successfully', 'Close', { duration: 3000 });
    // In a real implementation, you would call the API to create a stock request
  }

  clockIn(): void {
    this.clockedIn = true;
    this.clockInTime = new Date();
    this.snackBar.open('Clocked in successfully', 'Close', { duration: 3000 });
    // In a real implementation, you would call the API to clock in
  }

  clockOut(): void {
    this.clockedIn = false;
    this.clockInTime = null;
    this.snackBar.open('Clocked out successfully', 'Close', { duration: 3000 });
    // In a real implementation, you would call the API to clock out
  }
}