// src/app/core/services/hours.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, throwError, forkJoin } from 'rxjs';
import { catchError, tap, map, switchMap } from 'rxjs/operators';
import { WeeklyTimesheet, Schedule, ScheduleShift } from '../../shared/models/hours.model';
import { EmployeeService } from './employee.service';
import { StoreService } from './store.service';
import { AuthService } from '../auth/auth.service';
import { PermissionService } from '../auth/permission.service';
import { IdUtils } from '../utils/id-utils.service';
import { DateTimeUtils } from '../utils/date-time-utils.service';
import { ErrorHandlingService } from '../utils/error-handling.service';

@Injectable({
  providedIn: 'root'
})
export class HoursService {
  private timesheetsUrl = '/api/v1/timesheets';
  private schedulesUrl = '/api/v1/schedules';
  
  constructor(
    private http: HttpClient,
    private employeeService: EmployeeService,
    private storeService: StoreService,
    private authService: AuthService,
    private permissionService: PermissionService
  ) {}
  
  // ======== Timesheet Methods ========
  
  /**
   * Get timesheets with optional filtering
   */
  getTimesheets(options: {
    employee_id?: string,
    store_id?: string,
    start_date?: string,
    end_date?: string,
    status?: string,
    skip?: number,
    limit?: number
  } = {}): Observable<WeeklyTimesheet[]> {
    // Special handling for admin users trying to view their own timesheet
    if (options.employee_id && this.isAdminUser() && 
        options.employee_id === this.authService.currentUser?._id) {
      console.log('Admin user trying to view personal timesheets. Returning empty array.');
      return of([]); // Return empty array for admin users
    }
    
    // Create safe params for API request
    const safeParams = IdUtils.createIdParams(options);
    let params = new HttpParams();
    
    Object.keys(safeParams).forEach(key => {
      params = params.set(key, safeParams[key]);
    });
    
    return this.http.get<WeeklyTimesheet[]>(this.timesheetsUrl, { params }).pipe(
      tap(timesheets => console.log(`Fetched ${timesheets.length} timesheets`)),
      catchError(error => {
        console.error(`Error fetching timesheets: ${error.message}`);
        return of([]);
      })
    );
  }
  
  /**
   * Get current user's timesheets
   */
  getMyTimesheets(options: {
    status?: string,
    start_date?: string,
    end_date?: string
  } = {}): Observable<WeeklyTimesheet[]> {
    let params = new HttpParams();
    
    if (options.status) params = params.set('status', options.status);
    if (options.start_date) params = params.set('start_date', options.start_date);
    if (options.end_date) params = params.set('end_date', options.end_date);
    
    return this.http.get<WeeklyTimesheet[]>(`${this.timesheetsUrl}/me`, { params }).pipe(
      tap(timesheets => console.log(`Fetched ${timesheets.length} of my timesheets`)),
      catchError(error => {
        console.error(`Error fetching my timesheets: ${error.message}`);
        return of([]);
      })
    );
  }
  
  /**
   * Get current week's timesheet for the current user
   */
  getCurrentTimesheet(): Observable<WeeklyTimesheet | null> {
    return this.http.get<WeeklyTimesheet>(`${this.timesheetsUrl}/me/current`).pipe(
      tap(timesheet => console.log('Fetched current week timesheet')),
      catchError(error => {
        // If 404 (no current timesheet), return null instead of error
        if (error.status === 404) {
          return of(null);
        }
        console.error(`Error fetching current timesheet: ${error.message}`);
        return of(null);
      })
    );
  }
  
  /**
   * Get a specific timesheet by ID
   */
  getTimesheet(id: string): Observable<WeeklyTimesheet> {
    // Ensure ID is string format
    const safeId = IdUtils.ensureString(id);
    
    return this.http.get<WeeklyTimesheet>(`${this.timesheetsUrl}/${safeId}`).pipe(
      tap(_ => console.log(`Fetched timesheet id=${safeId}`)),
      catchError(ErrorHandlingService.handleError<WeeklyTimesheet>(`getTimesheet id=${safeId}`))
    );
  }
  
  /**
   * Create a new timesheet
   */
  createTimesheet(timesheet: Partial<WeeklyTimesheet>): Observable<WeeklyTimesheet> {
    return this.http.post<WeeklyTimesheet>(this.timesheetsUrl, timesheet).pipe(
      tap((newTimesheet: WeeklyTimesheet) => console.log(`Created timesheet id=${newTimesheet._id}`)),
      catchError(ErrorHandlingService.handleError<WeeklyTimesheet>('createTimesheet'))
    );
  }
  
  /**
   * Start a new timesheet for current week
   */
  startNewTimesheet(storeId: string): Observable<WeeklyTimesheet> {
    // Ensure store ID is string format
    const safeStoreId = IdUtils.ensureString(storeId);
    
    return this.http.post<WeeklyTimesheet>(`${this.timesheetsUrl}/me/start-new?store_id=${safeStoreId}`, {}).pipe(
      tap((timesheet: WeeklyTimesheet) => console.log(`Started new timesheet id=${timesheet._id}`)),
      catchError(ErrorHandlingService.handleError<WeeklyTimesheet>('startNewTimesheet'))
    );
  }
  
  /**
   * Update an existing timesheet
   */
  updateTimesheet(id: string, timesheet: Partial<WeeklyTimesheet>): Observable<WeeklyTimesheet> {
    // Ensure ID is string format
    const safeId = IdUtils.ensureString(id);
    
    return this.http.put<WeeklyTimesheet>(`${this.timesheetsUrl}/${safeId}`, timesheet).pipe(
      tap(_ => console.log(`Updated timesheet id=${safeId}`)),
      catchError(ErrorHandlingService.handleError<WeeklyTimesheet>(`updateTimesheet id=${safeId}`))
    );
  }
  
  /**
   * Update hours for a specific day in a timesheet
   */
  updateDailyHours(id: string, day: string, hours: number): Observable<WeeklyTimesheet> {
    // Ensure ID is string format and day is valid
    const safeId = IdUtils.ensureString(id);
    const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    
    if (!validDays.includes(day.toLowerCase())) {
      return throwError(() => new Error(`Invalid day: ${day}. Must be one of ${validDays.join(', ')}`));
    }
    
    return this.http.put<WeeklyTimesheet>(`${this.timesheetsUrl}/${safeId}/day-hours`, {
      day: day.toLowerCase(),
      hours: hours
    }).pipe(
      tap(_ => console.log(`Updated hours for ${day} in timesheet id=${safeId}`)),
      catchError(ErrorHandlingService.handleError<WeeklyTimesheet>(`updateDailyHours id=${safeId}`))
    );
  }
  
  /**
   * Submit a timesheet for approval
   */
  submitTimesheet(id: string, notes?: string): Observable<WeeklyTimesheet> {
    // Ensure ID is string format
    const safeId = IdUtils.ensureString(id);
    
    return this.http.post<WeeklyTimesheet>(`${this.timesheetsUrl}/${safeId}/submit`, { notes }).pipe(
      tap(_ => console.log(`Submitted timesheet id=${safeId}`)),
      catchError(ErrorHandlingService.handleError<WeeklyTimesheet>(`submitTimesheet id=${safeId}`))
    );
  }
  
  /**
   * Approve a timesheet
   */
  approveTimesheet(id: string, notes?: string): Observable<WeeklyTimesheet> {
    // Ensure ID is string format
    const safeId = IdUtils.ensureString(id);
    
    return this.http.post<WeeklyTimesheet>(`${this.timesheetsUrl}/${safeId}/approve`, {
      status: 'approved',
      notes: notes || ''
    }).pipe(
      tap(_ => console.log(`Approved timesheet id=${safeId}`)),
      catchError(ErrorHandlingService.handleError<WeeklyTimesheet>(`approveTimesheet id=${safeId}`))
    );
  }
  
  /**
   * Reject a timesheet with reason
   */
  rejectTimesheet(id: string, reason: string): Observable<WeeklyTimesheet> {
    // Ensure ID is string format
    const safeId = IdUtils.ensureString(id);
    
    return this.http.post<WeeklyTimesheet>(`${this.timesheetsUrl}/${safeId}/approve`, {
      status: 'rejected',
      notes: reason
    }).pipe(
      tap(_ => console.log(`Rejected timesheet id=${safeId}`)),
      catchError(ErrorHandlingService.handleError<WeeklyTimesheet>(`rejectTimesheet id=${safeId}`))
    );
  }
  
  /**
   * Delete a timesheet
   */
  deleteTimesheet(id: string): Observable<boolean> {
    // Ensure ID is string format
    const safeId = IdUtils.ensureString(id);
    
    return this.http.delete<boolean>(`${this.timesheetsUrl}/${safeId}`).pipe(
      tap(_ => console.log(`Deleted timesheet id=${safeId}`)),
      catchError(ErrorHandlingService.handleError<boolean>(`deleteTimesheet id=${safeId}`))
    );
  }
  
  // ======== Schedule Methods ========
  
  /**
   * Get schedules with optional filtering
   */
  getSchedules(options: {
    store_id?: string,
    start_date?: string,
    end_date?: string,
    skip?: number,
    limit?: number
  } = {}): Observable<Schedule[]> {
    // Create safe params for API request
    const safeParams = IdUtils.createIdParams(options);
    let params = new HttpParams();
    
    Object.keys(safeParams).forEach(key => {
      params = params.set(key, safeParams[key]);
    });
    
    return this.http.get<Schedule[]>(this.schedulesUrl, { params }).pipe(
      tap(schedules => console.log(`Fetched ${schedules.length} schedules`)),
      catchError(error => {
        console.error(`Error fetching schedules: ${error.message}`);
        return of([]);
      })
    );
  }
  
  /**
   * Get a specific schedule by ID
   */
  getSchedule(id: string): Observable<Schedule> {
    // Ensure ID is string format
    const safeId = IdUtils.ensureString(id);
    
    return this.http.get<Schedule>(`${this.schedulesUrl}/${safeId}`).pipe(
      tap(_ => console.log(`Fetched schedule id=${safeId}`)),
      catchError(ErrorHandlingService.handleError<Schedule>(`getSchedule id=${safeId}`))
    );
  }
  
  /**
   * Create a new schedule
   */
  createSchedule(schedule: Partial<Schedule>): Observable<Schedule> {
    return this.http.post<Schedule>(this.schedulesUrl, schedule).pipe(
      tap((newSchedule: Schedule) => console.log(`Created schedule id=${newSchedule._id}`)),
      catchError(ErrorHandlingService.handleError<Schedule>('createSchedule'))
    );
  }
  
  /**
   * Update an existing schedule
   */
  updateSchedule(id: string, schedule: Partial<Schedule>): Observable<Schedule> {
    // Ensure ID is string format
    const safeId = IdUtils.ensureString(id);
    
    return this.http.put<Schedule>(`${this.schedulesUrl}/${safeId}`, schedule).pipe(
      tap(_ => console.log(`Updated schedule id=${safeId}`)),
      catchError(ErrorHandlingService.handleError<Schedule>(`updateSchedule id=${safeId}`))
    );
  }
  
  /**
   * Delete a schedule
   */
  deleteSchedule(id: string): Observable<boolean> {
    // Ensure ID is string format
    const safeId = IdUtils.ensureString(id);
    
    return this.http.delete<boolean>(`${this.schedulesUrl}/${safeId}`).pipe(
      tap(_ => console.log(`Deleted schedule id=${safeId}`)),
      catchError(ErrorHandlingService.handleError<boolean>(`deleteSchedule id=${safeId}`))
    );
  }
  
  /**
   * Add a shift to a schedule
   */
  addShift(scheduleId: string, shift: ScheduleShift): Observable<Schedule> {
    // Ensure schedule ID is string format
    const safeScheduleId = IdUtils.ensureString(scheduleId);
    
    return this.http.post<Schedule>(`${this.schedulesUrl}/${safeScheduleId}/shifts`, shift).pipe(
      tap(_ => console.log(`Added shift to schedule id=${safeScheduleId}`)),
      catchError(ErrorHandlingService.handleError<Schedule>(`addShift scheduleId=${safeScheduleId}`))
    );
  }
  
  /**
   * Update a shift in a schedule
   */
  updateShift(scheduleId: string, shiftId: string, shift: Partial<ScheduleShift>): Observable<Schedule> {
    // Ensure IDs are string format
    const safeScheduleId = IdUtils.ensureString(scheduleId);
    const safeShiftId = IdUtils.ensureString(shiftId);
    
    return this.http.put<Schedule>(`${this.schedulesUrl}/${safeScheduleId}/shifts/${safeShiftId}`, shift).pipe(
      tap(_ => console.log(`Updated shift id=${safeShiftId} in schedule id=${safeScheduleId}`)),
      catchError(ErrorHandlingService.handleError<Schedule>(`updateShift scheduleId=${safeScheduleId}, shiftId=${safeShiftId}`))
    );
  }
  
  /**
   * Delete a shift from a schedule
   */
  deleteShift(scheduleId: string, shiftId: string): Observable<Schedule> {
    // Ensure IDs are string format
    const safeScheduleId = IdUtils.ensureString(scheduleId);
    const safeShiftId = IdUtils.ensureString(shiftId);
    
    return this.http.delete<Schedule>(`${this.schedulesUrl}/${safeScheduleId}/shifts/${safeShiftId}`).pipe(
      tap(_ => console.log(`Deleted shift id=${safeShiftId} from schedule id=${safeScheduleId}`)),
      catchError(ErrorHandlingService.handleError<Schedule>(`deleteShift scheduleId=${safeScheduleId}, shiftId=${safeShiftId}`))
    );
  }
  
  /**
   * Get schedule for specific employee
   */
  getEmployeeSchedule(employeeId: string, startDate?: string, endDate?: string): Observable<ScheduleShift[]> {
    // Ensure employee ID is string format
    const safeEmployeeId = IdUtils.ensureString(employeeId);
    console.log(`getEmployeeSchedule: Requesting shifts for employee ID: ${safeEmployeeId}`);
    
    let params = new HttpParams();
    if (startDate) params = params.set('start_date', startDate);
    if (endDate) params = params.set('end_date', endDate);
    
    return this.http.get<ScheduleShift[]>(`${this.schedulesUrl}/employee/${safeEmployeeId}`, { params }).pipe(
      tap(shifts => console.log(`Fetched ${shifts.length} shifts for employee id=${safeEmployeeId}`)),
      catchError(ErrorHandlingService.handleError<ScheduleShift[]>(`getEmployeeSchedule employeeId=${safeEmployeeId}`, []))
    );
  }
  
  // ======== Helper Methods ========
  
  /**
   * Check if the current user is an admin
   */
  private isAdminUser(): boolean {
    const currentUser = this.authService.currentUser;
    // Admin role ID
    return currentUser?.role_id === '67c9fb4d9db05f47c32b6b22';
  }
  
  /**
   * Get current employee ID from the authenticated user
   * Returns an Observable that emits the employee ID or null if no employee record exists
   */
  public getCurrentEmployeeId(): Observable<string | null> {
    // Get the current user
    const currentUser = this.authService.currentUser;
    if (!currentUser) {
      console.log('No authenticated user found');
      return of(null);
    }
    
    // If user is admin, they don't have an employee record
    if (this.isAdminUser()) {
      console.log('User is an admin without employee record');
      return of(null);
    }
    
    // For regular employees, check if they have an employee record
    return this.employeeService.getEmployeeByUserId(currentUser._id).pipe(
      map(employee => {
        if (employee) {
          return IdUtils.ensureString(employee._id);
        } else {
          console.log('No employee record found for user ID: ' + currentUser._id);
          return null;
        }
      }),
      catchError(error => {
        console.error('Error fetching employee record:', error);
        return of(null);
      })
    );
  }

  /**
   * Get start of the week (Monday) for a given date
   */
  getStartOfWeek(date: Date): Date {
    const result = new Date(date);
    const day = result.getDay() || 7; // Convert Sunday (0) to 7 for easier calculation
    const diff = result.getDate() - day + 1; // +1 to start with Monday
    result.setDate(diff);
    result.setHours(0, 0, 0, 0);
    return result;
  }

  /**
   * Get end of the week (Sunday) for a given date
   */
  getEndOfWeek(date: Date): Date {
    const result = new Date(date);
    const day = result.getDay() || 7; // Convert Sunday (0) to 7
    const diff = result.getDate() - day + 7; // +7 to end with Sunday
    result.setDate(diff);
    result.setHours(23, 59, 59, 999);
    return result;
  }
  
  /**
   * Calculate total hours from daily hours object
   */
  calculateTotalHours(dailyHours: { [key: string]: number }): number {
    return Object.values(dailyHours).reduce((total, hours) => total + hours, 0);
  }
}