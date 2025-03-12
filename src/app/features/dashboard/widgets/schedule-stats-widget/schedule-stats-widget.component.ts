// src/app/features/dashboard/widgets/schedule-stats-widget/schedule-stats-widget.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HoursService } from '../../../../core/services/hours.service';
import { PermissionService } from '../../../../core/auth/permission.service';
import { DateTimeUtils } from '../../../../core/utils/date-time-utils.service';

@Component({
  selector: 'app-schedule-stats-widget',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-hidden">
      <div class="p-5">
        <div class="flex items-center">
          <div class="flex-shrink-0 bg-indigo-100 dark:bg-indigo-900 rounded-md p-3">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-indigo-600 dark:text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div class="ml-5 w-0 flex-1">
            <dl>
              <dt class="text-sm font-medium text-slate-500 dark:text-slate-400 truncate">Current Schedule</dt>
              <dd class="flex items-baseline">
                <div *ngIf="!loading" class="text-2xl font-semibold text-slate-900 dark:text-white">
                  {{ hasCurrentSchedule ? shiftsCount + ' Shifts' : 'No Schedule' }}
                </div>
                <div *ngIf="loading" class="text-2xl font-semibold text-slate-400 dark:text-slate-500">...</div>
                <div *ngIf="!loading && hasCurrentSchedule" class="ml-2 flex items-baseline text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                  {{ nextShiftInfo }}
                </div>
              </dd>
            </dl>
          </div>
        </div>
      </div>
      <div class="bg-slate-50 dark:bg-slate-700 px-5 py-3">
        <div class="text-sm">
          <a routerLink="/schedules" class="font-medium text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white">View schedule</a>
        </div>
      </div>
    </div>
  `
})
export class ScheduleStatsWidgetComponent implements OnInit {
  loading = true;
  hasCurrentSchedule = false;
  shiftsCount = 0;
  nextShiftInfo = '';
  
  constructor(
    private hoursService: HoursService,
    private permissionService: PermissionService
  ) {}
  
  ngOnInit(): void {
    // Only load data if user has permission to view schedules
    if (this.permissionService.hasPermission('hours:read')) {
      this.loadScheduleStats();
    } else {
      this.loading = false;
    }
  }
  
  loadScheduleStats(): void {
    // If user is an employee, use the employee-specific endpoint
    if (this.permissionService.getRoleIdentifier() === 'employee') {
      console.log('Employee role, using employee/me endpoint for schedule stats');
      
      this.hoursService.getMyScheduleShifts().subscribe({
        next: (shifts) => {
          const hasShifts = shifts && shifts.length > 0;
          this.hasCurrentSchedule = hasShifts;
          this.shiftsCount = hasShifts ? shifts.length : 0;
          
          if (hasShifts) {
            console.log(`Found ${shifts.length} shifts for current employee`);
            this.calculateNextShift(shifts);
          } else {
            this.nextShiftInfo = '';
          }
          
          this.loading = false;
        },
        error: (err) => {
          console.error('Error loading employee schedule stats:', err);
          this.loading = false;
        }
      });
    } else {
      // For admin/manager, use the getCurrentSchedule method
      this.hoursService.getCurrentSchedule().subscribe({
        next: (schedule) => {
          if (schedule && schedule.shifts && schedule.shifts.length > 0) {
            console.log(`Schedule stats widget: Found current schedule with ${schedule.shifts.length} shifts`);
            this.hasCurrentSchedule = true;
            this.shiftsCount = schedule.shifts.length;
            
            // Find next shift (if any)
            this.calculateNextShift(schedule.shifts);
          } else {
            console.log('Schedule stats widget: No current schedule found');
            this.hasCurrentSchedule = false;
            this.shiftsCount = 0;
            this.nextShiftInfo = '';
          }
          
          this.loading = false;
        },
        error: (err) => {
          console.error('Error loading schedule stats:', err);
          this.loading = false;
        }
      });
    }
  }
  
  calculateNextShift(shifts: any[]): void {
    if (!shifts || shifts.length === 0) {
      this.nextShiftInfo = '';
      return;
    }
    
    const today = new Date();
    const currentDay = this.getDayName(today.getDay());
    const currentTime = today.getHours() * 60 + today.getMinutes();
    
    // Get today's shifts that haven't started yet
    const todaysUpcomingShifts = shifts
      .filter(shift => shift.day_of_week.toLowerCase() === currentDay)
      .filter(shift => {
        const [hours, minutes] = shift.start_time.split(':').map(Number);
        const shiftStartTime = hours * 60 + minutes;
        return shiftStartTime > currentTime;
      })
      .sort((a, b) => {
        const [aHours, aMinutes] = a.start_time.split(':').map(Number);
        const [bHours, bMinutes] = b.start_time.split(':').map(Number);
        return (aHours * 60 + aMinutes) - (bHours * 60 + bMinutes);
      });
      
    if (todaysUpcomingShifts.length > 0) {
      // There's a shift later today
      const nextShift = todaysUpcomingShifts[0];
      this.nextShiftInfo = `Next: Today at ${this.formatTime(nextShift.start_time)}`;
    } else {
      // Find next day with a shift
      const dayOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
      const todayIndex = dayOrder.indexOf(currentDay);
      
      let nextShiftFound = false;
      
      // Check remaining days of this week
      for (let i = 1; i <= 7 && !nextShiftFound; i++) {
        const nextDayIndex = (todayIndex + i) % 7;
        const nextDay = dayOrder[nextDayIndex];
        
        const nextDayShifts = shifts
          .filter(shift => shift.day_of_week.toLowerCase() === nextDay)
          .sort((a, b) => {
            const [aHours, aMinutes] = a.start_time.split(':').map(Number);
            const [bHours, bMinutes] = b.start_time.split(':').map(Number);
            return (aHours * 60 + aMinutes) - (bHours * 60 + bMinutes);
          });
          
        if (nextDayShifts.length > 0) {
          nextShiftFound = true;
          const nextShift = nextDayShifts[0];
          const dayName = this.formatDayName(nextDay);
          this.nextShiftInfo = `Next: ${dayName} at ${this.formatTime(nextShift.start_time)}`;
          break;
        }
      }
      
      if (!nextShiftFound) {
        this.nextShiftInfo = '';
      }
    }
  }
  
  getDayName(dayNumber: number): string {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return days[dayNumber];
  }
  
  formatDayName(day: string): string {
    return day.charAt(0).toUpperCase() + day.slice(1);
  }
  
  formatTime(timeStr: string): string {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  }
}