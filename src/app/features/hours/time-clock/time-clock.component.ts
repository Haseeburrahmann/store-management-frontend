// src/app/features/hours/time-clock/time-clock.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HoursService } from '../../../core/services/hours.service';
import { StoreService } from '../../../core/services/store.service';
import { AuthService } from '../../../core/auth/auth.service';
import { TimeEntry } from '../../../shared/models/hours.model';
import { Store } from '../../../shared/models/store.model';
import { interval, Observable, Subscription } from 'rxjs';
import { DateTimeUtils } from '../../../core/utils/date-time-utils.service';

@Component({
  selector: 'app-time-clock',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h1 class="page-title">Time Clock</h1>
        <div class="flex flex-col sm:flex-row gap-4">
          <button routerLink="/hours" class="btn btn-outline flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Hours Dashboard
          </button>
        </div>
      </div>
      
      <!-- Loading Indicator -->
      <div *ngIf="loading" class="flex justify-center my-10">
        <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
      
      <!-- Time Clock Container -->
      <div *ngIf="!loading" class="max-w-4xl mx-auto">
        <!-- Current Time Display -->
        <div class="card mb-6 text-center">
          <h2 class="text-lg font-semibold mb-2">Current Time</h2>
          <div class="text-4xl font-bold mb-2">{{ currentTime }}</div>
          <div class="text-[var(--text-secondary)]">{{ currentDate }}</div>
        </div>
        
        <!-- Active Session Card -->
        <div *ngIf="activeTimeEntry" class="card mb-6">
          <h2 class="text-lg font-semibold mb-4">Active Session</h2>
          <div class="bg-green-100 dark:bg-green-900 p-4 rounded-md text-green-800 dark:text-green-200 mb-4">
            <div class="flex items-center justify-between">
              <div>
                <div class="font-medium text-lg">Clocked In: {{ formatTime(activeTimeEntry.clock_in) }}</div>
                <div class="text-sm mt-1">{{ formatDate(activeTimeEntry.clock_in) }}</div>
                <div class="text-sm mt-1">Location: {{ activeTimeEntry.store_name }}</div>
              </div>
              <div class="text-center">
                <div class="text-sm">Duration</div>
                <div class="text-2xl font-bold">{{ sessionDuration }}</div>
              </div>
            </div>
          </div>
          
          <!-- Break Controls -->
          <div *ngIf="!onBreak && !activeTimeEntry.break_start" class="mb-4">
            <button 
              (click)="startBreak()"
              class="btn btn-warning w-full"
            >
              Start Break
            </button>
          </div>
          
          <div *ngIf="onBreak" class="mb-4">
            <div class="bg-yellow-100 dark:bg-yellow-900 p-4 rounded-md text-yellow-800 dark:text-yellow-200 mb-4">
              <div class="flex items-center justify-between">
                <div>
                  <div class="font-medium">On Break</div>
                  <div class="text-sm">Started: {{ formatTime(breakStartTime) }}</div>
                </div>
                <div class="text-center">
                  <div class="text-sm">Break Duration</div>
                  <div class="text-xl font-bold">{{ breakDuration }}</div>
                </div>
              </div>
            </div>
            <button 
              (click)="endBreak()"
              class="btn btn-warning w-full"
            >
              End Break
            </button>
          </div>
          
          <!-- Clock Out Form -->
          <form (ngSubmit)="clockOut()">
            <div class="mb-4">
              <label for="notes" class="form-label">Notes (optional)</label>
              <textarea 
                id="notes" 
                [(ngModel)]="clockOutNotes"
                name="notes"
                class="form-control" 
                rows="3"
                placeholder="Add any notes about your shift..."
              ></textarea>
            </div>
            <button 
              type="submit" 
              class="btn btn-danger w-full"
              [disabled]="onBreak"
            >
              Clock Out
            </button>
            <div *ngIf="onBreak" class="text-center text-sm text-[var(--text-secondary)] mt-2">
              You must end your break before clocking out.
            </div>
          </form>
        </div>
        
        <!-- Clock In Card -->
        <div *ngIf="!activeTimeEntry" class="card">
          <h2 class="text-lg font-semibold mb-4">Clock In</h2>
          <form (ngSubmit)="clockIn()">
            <div class="mb-4">
              <label for="storeSelect" class="form-label">Select Store</label>
              <select 
                id="storeSelect" 
                [(ngModel)]="selectedStoreId"
                name="storeId"
                class="form-control"
                required
              >
                <option value="" disabled>Select a store</option>
                <option *ngFor="let store of availableStores" [value]="store._id">
                  {{ store.name }} ({{ store.city }}, {{ store.state }})
                </option>
              </select>
            </div>
            <div class="mb-4">
              <label for="notes" class="form-label">Notes (optional)</label>
              <textarea 
                id="notes" 
                [(ngModel)]="clockInNotes"
                name="notes"
                class="form-control" 
                rows="3"
                placeholder="Add any notes about your shift..."
              ></textarea>
            </div>
            <button 
              type="submit" 
              class="btn btn-success w-full"
              [disabled]="!selectedStoreId"
            >
              Clock In
            </button>
          </form>
        </div>
        
        <!-- Recent Time Entries -->
        <div class="card mt-6">
          <h2 class="text-lg font-semibold mb-4">Recent Time Entries</h2>
          
          <div *ngIf="recentTimeEntries.length === 0" class="text-center text-[var(--text-secondary)] py-4">
            No recent time entries found.
          </div>
          
          <div *ngFor="let entry of recentTimeEntries" class="border-b border-[var(--border-color)] py-3 last:border-b-0">
            <div class="flex justify-between items-start">
              <div>
                <div class="font-medium">{{ formatDate(entry.clock_in) }}</div>
                <div class="text-sm">
                  {{ formatTime(entry.clock_in) }} - {{ entry.clock_out ? formatTime(entry.clock_out) : 'In Progress' }}
                </div>
                <div class="text-sm text-[var(--text-secondary)]">{{ entry.store_name }}</div>
              </div>
              <div class="text-right">
                <span 
                  [ngClass]="{
                    'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200': entry.status === 'approved',
                    'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200': entry.status === 'pending',
                    'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200': entry.status === 'rejected'
                  }"
                  class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                >
                  {{ entry.status | titlecase }}
                </span>
                <div class="text-sm mt-1">
                  {{ entry.total_minutes ? (entry.total_minutes / 60).toFixed(1) + ' hours' : '' }}
                </div>
              </div>
            </div>
            <div *ngIf="entry.notes" class="mt-2 text-sm text-[var(--text-secondary)] italic">
              "{{ entry.notes }}"
            </div>
          </div>
          
          <div class="mt-4 text-center">
            <a routerLink="/hours/my-timesheets" class="btn btn-sm btn-outline">
              View All Time Entries
            </a>
          </div>
        </div>
      </div>
    </div>
  `
})
export class TimeClockComponent implements OnInit {
  loading = true;
  currentTime = '';
  currentDate = '';
  sessionDuration = '0h 0m';
  breakDuration = '0m';
  clockTimerSubscription?: Subscription;
  sessionTimerSubscription?: Subscription;
  breakTimerSubscription?: Subscription;
  
  // Time entry data
  activeTimeEntry: TimeEntry | null = null;
  recentTimeEntries: TimeEntry[] = [];
  
  // Clock in form
  availableStores: Store[] = [];
  selectedStoreId = '';
  clockInNotes = '';
  
  // Clock out form
  clockOutNotes = '';
  
  // Break tracking
  onBreak = false;
  breakStartTime = '';
  
  constructor(
    private hoursService: HoursService,
    private storeService: StoreService,
    private authService: AuthService
  ) {}
  
  ngOnInit(): void {
    this.updateCurrentTime();
    
    // Start clock timer
    this.clockTimerSubscription = interval(1000).subscribe(() => {
      this.updateCurrentTime();
    });
    
    // Load data
    this.loadTimeClockData();
  }
  
  ngOnDestroy(): void {
    // Clean up all subscriptions
    if (this.clockTimerSubscription) {
      this.clockTimerSubscription.unsubscribe();
    }
    
    if (this.sessionTimerSubscription) {
      this.sessionTimerSubscription.unsubscribe();
    }
    
    if (this.breakTimerSubscription) {
      this.breakTimerSubscription.unsubscribe();
    }
  }
  
  loadTimeClockData(): void {
    this.loading = true;
    
    // Get current user information
    const currentUser = this.authService.currentUser;
    if (!currentUser) {
      console.error('No authenticated user found');
      this.loading = false;
      return;
    }
    
    // Load all stores
    this.storeService.getActiveStores().subscribe({
      next: (stores) => {
        this.availableStores = stores;
        
        // Check for active time entry
        this.hoursService.getActiveTimeEntry().subscribe({
          next: (entry) => {
            this.activeTimeEntry = entry;
            
            if (entry) {
              // Start session timer if there's an active entry
              this.startSessionTimer(entry.clock_in);
              
              // Check if on break
              if (entry.break_start && !entry.break_end) {
                this.onBreak = true;
                this.breakStartTime = entry.break_start;
                this.startBreakTimer(entry.break_start);
              }
            }
            
            // Load recent time entries using employee ID from active entry
            if (entry) {
              this.loadRecentTimeEntries(entry.employee_id);
            } else {
              // Try to get employee ID from auth service
              this.hoursService.getCurrentEmployeeId().subscribe(employeeId => {
                if (employeeId) {
                  this.loadRecentTimeEntries(employeeId);
                }
                this.loading = false;
              });
            }
            
          },
          error: (err) => {
            console.error('Error fetching active time entry:', err);
            this.loading = false;
          }
        });
      },
      error: (err) => {
        console.error('Error fetching stores:', err);
        this.loading = false;
      }
    });
  }
  
  loadRecentTimeEntries(employeeId: string): void {
    // Get the last 5 time entries
    this.hoursService.getTimeEntries({
      employee_id: employeeId,
      limit: 5
    }).subscribe({
      next: (entries) => {
        this.recentTimeEntries = entries;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error fetching recent time entries:', err);
        this.loading = false;
      }
    });
  }
  
  updateCurrentTime(): void {
    const now = new Date();
    this.currentTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    this.currentDate = now.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  }
  
  startSessionTimer(startTimeStr: string): void {
    // Cancel any existing timer
    if (this.sessionTimerSubscription) {
      this.sessionTimerSubscription.unsubscribe();
    }
    
    // Update duration immediately
    this.updateSessionDuration(startTimeStr);
    
    // Start a timer to update duration every minute
    this.sessionTimerSubscription = interval(60000).subscribe(() => {
      this.updateSessionDuration(startTimeStr);
    });
  }
  
  updateSessionDuration(startTimeStr: string): void {
    const durationMinutes = DateTimeUtils.calculateDurationMinutes(startTimeStr, new Date().toISOString());
    this.sessionDuration = DateTimeUtils.formatDuration(durationMinutes);
  }
  
  startBreakTimer(startTimeStr: string): void {
    // Cancel any existing timer
    if (this.breakTimerSubscription) {
      this.breakTimerSubscription.unsubscribe();
    }
    
    // Update duration immediately
    this.updateBreakDuration(startTimeStr);
    
    // Start a timer to update duration every minute
    this.breakTimerSubscription = interval(60000).subscribe(() => {
      this.updateBreakDuration(startTimeStr);
    });
  }
  
  updateBreakDuration(startTimeStr: string): void {
    const durationMinutes = DateTimeUtils.calculateDurationMinutes(startTimeStr, new Date().toISOString());
    this.breakDuration = DateTimeUtils.formatDuration(durationMinutes);
  }
  
  clockIn(): void {
    if (!this.selectedStoreId) {
      alert('Please select a store to clock in.');
      return;
    }
    
    this.hoursService.clockIn(this.selectedStoreId, this.clockInNotes).subscribe({
      next: (entry) => {
        this.activeTimeEntry = entry;
        this.startSessionTimer(entry.clock_in);
        this.clockInNotes = '';
        
        // Reload recent time entries using the employee ID from the new entry
        if (entry && entry.employee_id) {
          this.loadRecentTimeEntries(entry.employee_id);
        }
      },
      error: (err) => {
        console.error('Error clocking in:', err);
        alert('There was an error clocking in. Please try again.');
      }
    });
  }
  
  clockOut(): void {
    if (!this.activeTimeEntry || !this.activeTimeEntry._id) {
      return;
    }
    
    if (this.onBreak) {
      alert('Please end your break before clocking out.');
      return;
    }
    
    this.hoursService.clockOut(this.activeTimeEntry._id, this.clockOutNotes).subscribe({
      next: (entry) => {
        // Stop session timer
        if (this.sessionTimerSubscription) {
          this.sessionTimerSubscription.unsubscribe();
        }
        
        // Capture employee_id for recent entries reload
        const employeeId = this.activeTimeEntry?.employee_id;
        
        this.activeTimeEntry = null;
        this.clockOutNotes = '';
        
        // Reload recent time entries
        if (employeeId) {
          this.loadRecentTimeEntries(employeeId);
        }
      },
      error: (err) => {
        console.error('Error clocking out:', err);
        alert('There was an error clocking out. Please try again.');
      }
    });
  }
  
  startBreak(): void {
    if (!this.activeTimeEntry || !this.activeTimeEntry._id) {
      return;
    }
    
    const now = new Date().toISOString();
    
    // Update the time entry with break start time
    this.hoursService.updateTimeEntry(this.activeTimeEntry._id, {
      break_start: now
    }).subscribe({
      next: (entry) => {
        this.activeTimeEntry = entry;
        this.onBreak = true;
        this.breakStartTime = now;
        this.startBreakTimer(now);
      },
      error: (err) => {
        console.error('Error starting break:', err);
        alert('There was an error starting your break. Please try again.');
      }
    });
  }
  
  endBreak(): void {
    if (!this.activeTimeEntry || !this.activeTimeEntry._id) {
      return;
    }
    
    const now = new Date().toISOString();
    
    // Update the time entry with break end time
    this.hoursService.updateTimeEntry(this.activeTimeEntry._id, {
      break_end: now
    }).subscribe({
      next: (entry) => {
        this.activeTimeEntry = entry;
        this.onBreak = false;
        
        // Stop break timer
        if (this.breakTimerSubscription) {
          this.breakTimerSubscription.unsubscribe();
        }
      },
      error: (err) => {
        console.error('Error ending break:', err);
        alert('There was an error ending your break. Please try again.');
      }
    });
  }
  
  // Helper methods for formatting dates and times
  formatDate(dateTimeStr: string): string {
    return DateTimeUtils.formatDateForDisplay(dateTimeStr);
  }
  
  formatTime(dateTimeStr: string): string {
    return DateTimeUtils.formatTimeForDisplay(dateTimeStr);
  }
}