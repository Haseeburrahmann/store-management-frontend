// src/app/core/services/hours.service.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, forkJoin, throwError } from 'rxjs';
import { catchError, tap, map, switchMap } from 'rxjs/operators';
import { TimeEntry, WeeklyTimesheet, Schedule, ScheduleShift } from '../../shared/models/hours.model';
import { EmployeeService } from './employee.service';
import { StoreService } from './store.service';
import { AuthService } from '../auth/auth.service';
import { PermissionService } from '../auth/permission.service';
import { IdUtils } from '../../core/utils/id-utils.service';
import { DateTimeUtils } from '../../core/utils/date-time-utils.service';
import { ErrorHandlingService } from '../../core/utils/error-handling.service';

@Injectable({
  providedIn: 'root'
})
export class HoursService {
  private timeEntriesUrl = '/api/v1/hours';
  private timesheetsUrl = '/api/v1/timesheets';
  private schedulesUrl = '/api/v1/schedules';
  
  constructor(
    private http: HttpClient,
    private employeeService: EmployeeService,
    private storeService: StoreService,
    private authService: AuthService,
    private permissionService: PermissionService
  ) {}
  
  // ======== Time Entries ========
  
  /**
   * Get time entries with optional filtering
   */
  getTimeEntries(options: {
    employee_id?: string,
    store_id?: string,
    start_date?: string,
    end_date?: string,
    status?: string,
    skip?: number,
    limit?: number
  } = {}): Observable<TimeEntry[]> {
    // Special handling for admin users trying to view their own hours
    if (options.employee_id && this.isAdminUser() && 
        options.employee_id === this.authService.currentUser?._id) {
      console.log('Admin user trying to view personal hours. Returning empty array.');
      return of([]); // Return empty array for admin users
    }
    
    // If employee_id is provided, ensure it's a string and log it
    if (options.employee_id) {
      options.employee_id = IdUtils.ensureString(options.employee_id);
      console.log(`getTimeEntries: Requesting entries for employee ID: ${options.employee_id}`);
    }
    
    // Ensure all IDs are strings
    const safeParams = IdUtils.createIdParams(options);
    let params = new HttpParams();
    
    Object.keys(safeParams).forEach(key => {
      params = params.set(key, safeParams[key]);
    });
    
    return this.http.get<TimeEntry[]>(this.timeEntriesUrl, { params }).pipe(
      tap(entries => console.log(`Fetched ${entries.length} time entries`)),
      // Add an extra filter on the frontend if employee_id was specified
      map(entries => {
        if (options.employee_id) {
          return entries.filter(entry => 
            IdUtils.ensureString(entry.employee_id) === options.employee_id
          );
        }
        return entries;
      }),
      switchMap(entries => this.enhanceTimeEntries(entries)),
      catchError(error => {
        console.error(`getTimeEntries failed: ${error.message}`);
        return of([]);
      })
    );
  }
  
  /**
   * Get a specific time entry by ID
   */
  getTimeEntry(id: string): Observable<TimeEntry> {
    // Ensure ID is string format
    const safeId = IdUtils.ensureString(id);
    const url = `${this.timeEntriesUrl}/${safeId}`;
    
    return this.http.get<TimeEntry>(url).pipe(
      tap(_ => console.log(`Fetched time entry id=${safeId}`)),
      switchMap(entry => this.enhanceTimeEntries([entry]).pipe(
        map(entries => entries[0])
      )),
      catchError(ErrorHandlingService.handleError<TimeEntry>(`getTimeEntry id=${safeId}`))
    );
  }
  
  /**
   * Create a new time entry
   */
  createTimeEntry(entry: Partial<TimeEntry>): Observable<TimeEntry> {
    // Ensure IDs are strings
    const safeEntry = this.normalizeTimeEntryForApi(entry);
    
    return this.http.post<TimeEntry>(this.timeEntriesUrl, safeEntry).pipe(
      tap((newEntry: TimeEntry) => console.log(`Created time entry id=${newEntry._id}`)),
      catchError(ErrorHandlingService.handleError<TimeEntry>('createTimeEntry'))
    );
  }
  
  /**
   * Update an existing time entry
   */
  updateTimeEntry(id: string, entry: Partial<TimeEntry>): Observable<TimeEntry> {
    // Ensure ID is string format
    const safeId = IdUtils.ensureString(id);
    const url = `${this.timeEntriesUrl}/${safeId}`;
    
    // Normalize entry for API
    const safeEntry = this.normalizeTimeEntryForApi(entry);
    
    return this.http.put<TimeEntry>(url, safeEntry).pipe(
      tap(_ => console.log(`Updated time entry id=${safeId}`)),
      catchError(ErrorHandlingService.handleError<TimeEntry>(`updateTimeEntry id=${safeId}`))
    );
  }
  
  /**
   * Delete a time entry
   */
  deleteTimeEntry(id: string): Observable<boolean> {
    // Ensure ID is string format
    const safeId = IdUtils.ensureString(id);
    const url = `${this.timeEntriesUrl}/${safeId}`;
    
    return this.http.delete<boolean>(url).pipe(
      tap(_ => console.log(`Deleted time entry id=${safeId}`)),
      catchError(ErrorHandlingService.handleError<boolean>(`deleteTimeEntry id=${safeId}`))
    );
  }
  
  /**
   * Clock in for the current user
   */
  clockIn(storeId: string, notes?: string): Observable<TimeEntry> {
    // Ensure store ID is string format
    const safeStoreId = IdUtils.ensureString(storeId);
    
    // Get the employee ID for the current user
    return this.getCurrentEmployeeId().pipe(
      switchMap(employeeId => {
        if (!employeeId) {
          return throwError(() => new Error('No employee record found for current user'));
        }
        
        const entry: Partial<TimeEntry> = {
          employee_id: employeeId,
          store_id: safeStoreId,
          clock_in: new Date().toISOString(),
          status: 'pending',
          notes: notes
        };
        
        return this.createTimeEntry(entry);
      })
    );
  }
  
  /**
   * Clock out for a specific time entry
   */
  clockOut(entryId: string, notes?: string): Observable<TimeEntry> {
    // Ensure ID is string format
    const safeId = IdUtils.ensureString(entryId);
    
    const updatedData: Partial<TimeEntry> = {
      clock_out: new Date().toISOString(),
      notes: notes
    };
    
    return this.updateTimeEntry(safeId, updatedData);
  }
  
  /**
   * Get active time entry (clocked in but not out) for an employee
   */
  getActiveTimeEntry(employeeId?: string): Observable<TimeEntry | null> {
    // If employeeId is provided directly, use it
    if (employeeId) {
      return this.fetchActiveTimeEntry(employeeId);
    }
    
    // Otherwise, try to get the employee ID for the current user
    return this.getCurrentEmployeeId().pipe(
      switchMap(currentEmployeeId => {
        if (!currentEmployeeId) {
          return of(null); // No employee record found for current user
        }
        return this.fetchActiveTimeEntry(currentEmployeeId);
      })
    );
  }
  
  /**
   * Helper method to fetch active time entry using the API
   */
  private fetchActiveTimeEntry(employeeId: string): Observable<TimeEntry | null> {
    // Ensure employee ID is string
    const safeEmployeeId = IdUtils.ensureString(employeeId);
    
    // Get pending entries for this employee
    let params = new HttpParams()
      .set('employee_id', safeEmployeeId)
      .set('status', 'pending');
    
    return this.http.get<TimeEntry[]>(this.timeEntriesUrl, { params }).pipe(
      switchMap(entries => this.enhanceTimeEntries(entries)),
      map(entries => {
        // Find the entry that has clock_in but no clock_out
        const activeEntries = entries.filter(entry => entry.clock_in && !entry.clock_out);
        return activeEntries.length > 0 ? activeEntries[0] : null;
      }),
      tap(entry => {
        if (entry) {
          console.log(`Found active time entry for employee id=${safeEmployeeId}`);
        } else {
          console.log(`No active time entry found for employee id=${safeEmployeeId}`);
        }
      }),
      catchError(error => {
        console.error(`Error fetching active time entry: ${error.message}`);
        return of(null);
      })
    );
  }
  
  /**
   * Approve a time entry
   */
  approveTimeEntry(id: string): Observable<TimeEntry> {
    // Ensure ID is string format
    const safeId = IdUtils.ensureString(id);
    const url = `${this.timeEntriesUrl}/${safeId}/approve`;
    
    // Match the backend HourApproval schema
    const approvalData = {
      status: 'approved',
      notes: ''
    };
    
    return this.http.put<TimeEntry>(url, approvalData).pipe(
      tap(_ => console.log(`Approved time entry id=${safeId}`)),
      catchError(ErrorHandlingService.handleError<TimeEntry>(`approveTimeEntry id=${safeId}`))
    );
  }
  
  /**
   * Reject a time entry with reason
   */
  rejectTimeEntry(id: string, reason: string): Observable<TimeEntry> {
    // Ensure ID is string format
    const safeId = IdUtils.ensureString(id);
    const url = `${this.timeEntriesUrl}/${safeId}/approve`;
    
    // Match the backend HourApproval schema
    const rejectionData = {
      status: 'rejected',
      notes: reason
    };
    
    return this.http.put<TimeEntry>(url, rejectionData).pipe(
      tap(_ => console.log(`Rejected time entry id=${safeId}`)),
      catchError(ErrorHandlingService.handleError<TimeEntry>(`rejectTimeEntry id=${safeId}`))
    );
  }
  
  // ======== Timesheets ========
  
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
    // Special handling for admin users trying to view their own timesheets
    if (options.employee_id && this.isAdminUser() && 
        options.employee_id === this.authService.currentUser?._id) {
      console.log('Admin user trying to view personal timesheets. Returning empty array.');
      return of([]); // Return empty array for admin users
    }
    
    // Ensure all IDs are string format
    const safeParams = IdUtils.createIdParams(options);
    let params = new HttpParams();
    
    Object.keys(safeParams).forEach(key => {
      params = params.set(key, safeParams[key]);
    });
    
    return this.http.get<WeeklyTimesheet[]>(this.timesheetsUrl, { params }).pipe(
      tap(timesheets => console.log(`Fetched ${timesheets.length} timesheets`)),
      switchMap(timesheets => this.enhanceTimesheets(timesheets)),
      catchError(ErrorHandlingService.handleError<WeeklyTimesheet[]>('getTimesheets', []))
    );
  }
  
  /**
   * Get a specific timesheet by ID
   */
  getTimesheet(id: string): Observable<WeeklyTimesheet> {
    // Ensure ID is string format
    const safeId = IdUtils.ensureString(id);
    const url = `${this.timesheetsUrl}/${safeId}`;
    
    return this.http.get<WeeklyTimesheet>(url).pipe(
      tap(_ => console.log(`Fetched timesheet id=${safeId}`)),
      switchMap(timesheet => this.enhanceTimesheets([timesheet]).pipe(
        map(timesheets => timesheets[0])
      )),
      catchError(ErrorHandlingService.handleError<WeeklyTimesheet>(`getTimesheet id=${safeId}`))
    );
  }
  
  /**
   * Create a new timesheet
   */
  createTimesheet(timesheet: Partial<WeeklyTimesheet>): Observable<WeeklyTimesheet> {
    // Normalize timesheet for API
    const safeTimesheet = this.normalizeTimesheetForApi(timesheet);
    
    return this.http.post<WeeklyTimesheet>(this.timesheetsUrl, safeTimesheet).pipe(
      tap((newTimesheet: WeeklyTimesheet) => console.log(`Created timesheet id=${newTimesheet._id}`)),
      catchError(ErrorHandlingService.handleError<WeeklyTimesheet>('createTimesheet'))
    );
  }
  
  /**
   * Update an existing timesheet
   */
  updateTimesheet(id: string, timesheet: Partial<WeeklyTimesheet>): Observable<WeeklyTimesheet> {
    // Ensure ID is string format
    const safeId = IdUtils.ensureString(id);
    const url = `${this.timesheetsUrl}/${safeId}`;
    
    // Normalize timesheet for API
    const safeTimesheet = this.normalizeTimesheetForApi(timesheet);
    
    return this.http.put<WeeklyTimesheet>(url, safeTimesheet).pipe(
      tap(_ => console.log(`Updated timesheet id=${safeId}`)),
      catchError(ErrorHandlingService.handleError<WeeklyTimesheet>(`updateTimesheet id=${safeId}`))
    );
  }
  
  /**
   * Delete a timesheet
   */
  deleteTimesheet(id: string): Observable<boolean> {
    // Ensure ID is string format
    const safeId = IdUtils.ensureString(id);
    const url = `${this.timesheetsUrl}/${safeId}`;
    
    return this.http.delete<boolean>(url).pipe(
      tap(_ => console.log(`Deleted timesheet id=${safeId}`)),
      catchError(ErrorHandlingService.handleError<boolean>(`deleteTimesheet id=${safeId}`))
    );
  }
  
  /**
   * Submit a timesheet for approval
   */
  submitTimesheet(id: string, notes?: string): Observable<WeeklyTimesheet> {
    // Ensure ID is string format
    const safeId = IdUtils.ensureString(id);
    const url = `${this.timesheetsUrl}/${safeId}/submit`;
    
    // Match the backend TimesheetSubmit schema
    const submitData = { notes };
    
    return this.http.post<WeeklyTimesheet>(url, submitData).pipe(
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
    const url = `${this.timesheetsUrl}/${safeId}/approve`;
    
    // Match the backend TimesheetApproval schema
    const approvalData = {
      status: 'approved',
      notes: notes || ''
    };
    
    return this.http.post<WeeklyTimesheet>(url, approvalData).pipe(
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
    const url = `${this.timesheetsUrl}/${safeId}/approve`;
    
    // Match the backend TimesheetApproval schema
    const rejectionData = {
      status: 'rejected',
      notes: reason
    };
    
    return this.http.post<WeeklyTimesheet>(url, rejectionData).pipe(
      tap(_ => console.log(`Rejected timesheet id=${safeId}`)),
      catchError(ErrorHandlingService.handleError<WeeklyTimesheet>(`rejectTimesheet id=${safeId}`))
    );
  }
  
  /**
   * Get the current timesheet for an employee
   */
  getCurrentTimesheet(employeeId: string): Observable<WeeklyTimesheet | null> {
    // Special handling for admin users
    if (this.isAdminUser() && employeeId === this.authService.currentUser?._id) {
      console.log('Admin user trying to view personal timesheet. Returning null.');
      return of(null);
    }
    
    // Ensure employee ID is string format
    const safeEmployeeId = IdUtils.ensureString(employeeId);
    
    // Use the me/current endpoint from the backend
    const url = `${this.timesheetsUrl}/me/current`;
    
    return this.http.get<WeeklyTimesheet>(url).pipe(
      tap(timesheet => console.log(`Fetched current timesheet for employee id=${safeEmployeeId}`)),
      catchError(error => {
        // If 404 (no current timesheet), return null instead of error
        if (error.status === 404) {
          return of(null);
        }
        return ErrorHandlingService.handleError<WeeklyTimesheet | null>('getCurrentTimesheet', null)(error);
      })
    );
  }
  
  /**
   * Add a time entry to a timesheet
   */
  addTimeEntryToTimesheet(timesheetId: string, timeEntryId: string): Observable<WeeklyTimesheet> {
    // Ensure both IDs are string format
    const safeTimesheetId = IdUtils.ensureString(timesheetId);
    const safeTimeEntryId = IdUtils.ensureString(timeEntryId);
    
    const url = `${this.timesheetsUrl}/${safeTimesheetId}/time-entries/${safeTimeEntryId}`;
    
    return this.http.post<WeeklyTimesheet>(url, {}).pipe(
      tap(_ => console.log(`Added time entry ${safeTimeEntryId} to timesheet ${safeTimesheetId}`)),
      catchError(ErrorHandlingService.handleError<WeeklyTimesheet>(`addTimeEntryToTimesheet`))
    );
  }
  
  /**
   * Remove a time entry from a timesheet
   */
  removeTimeEntryFromTimesheet(timesheetId: string, timeEntryId: string): Observable<WeeklyTimesheet> {
    // Ensure both IDs are string format
    const safeTimesheetId = IdUtils.ensureString(timesheetId);
    const safeTimeEntryId = IdUtils.ensureString(timeEntryId);
    
    const url = `${this.timesheetsUrl}/${safeTimesheetId}/time-entries/${safeTimeEntryId}`;
    
    return this.http.delete<WeeklyTimesheet>(url).pipe(
      tap(_ => console.log(`Removed time entry ${safeTimeEntryId} from timesheet ${safeTimesheetId}`)),
      catchError(ErrorHandlingService.handleError<WeeklyTimesheet>(`removeTimeEntryFromTimesheet`))
    );
  }
  
  /**
   * Generate a timesheet from hours records
   */
  generateTimesheet(employeeId: string, storeId: string, startDate: string, endDate: string): Observable<WeeklyTimesheet> {
    // Special handling for admin users
    if (this.isAdminUser() && employeeId === this.authService.currentUser?._id) {
      console.log('Admin user trying to generate personal timesheet. Returning error.');
      return throwError(() => new Error('Admin users cannot generate timesheets for themselves'));
    }
    
    // Ensure IDs are string format
    const safeEmployeeId = IdUtils.ensureString(employeeId);
    const safeStoreId = IdUtils.ensureString(storeId);
    
    const url = `${this.timesheetsUrl}/generate`;
    const params = new HttpParams()
      .set('employee_id', safeEmployeeId)
      .set('store_id', safeStoreId)
      .set('start_date', startDate)
      .set('end_date', endDate);
    
    return this.http.post<WeeklyTimesheet>(url, null, { params }).pipe(
      tap(_ => console.log(`Generated timesheet for employee ${safeEmployeeId}`)),
      catchError(ErrorHandlingService.handleError<WeeklyTimesheet>(`generateTimesheet`))
    );
  }
  
  // ======== Schedules ========
  
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
    // Ensure all IDs are string format
    const safeParams = IdUtils.createIdParams(options);
    let params = new HttpParams();
    
    Object.keys(safeParams).forEach(key => {
      params = params.set(key, safeParams[key]);
    });
    
    return this.http.get<Schedule[]>(this.schedulesUrl, { params }).pipe(
      tap(schedules => console.log(`Fetched ${schedules.length} schedules`)),
      // Continued from previous part...

      switchMap(schedules => this.enhanceSchedules(schedules)),
      catchError(ErrorHandlingService.handleError<Schedule[]>('getSchedules', []))
    );
  }
  
  /**
   * Get a specific schedule by ID
   */
  getSchedule(id: string): Observable<Schedule> {
    // Ensure ID is string format
    const safeId = IdUtils.ensureString(id);
    const url = `${this.schedulesUrl}/${safeId}`;
    
    return this.http.get<Schedule>(url).pipe(
      tap(_ => console.log(`Fetched schedule id=${safeId}`)),
      switchMap(schedule => this.enhanceSchedules([schedule]).pipe(
        map(schedules => schedules[0])
      )),
      catchError(ErrorHandlingService.handleError<Schedule>(`getSchedule id=${safeId}`))
    );
  }
  
  /**
   * Create a new schedule
   */
  createSchedule(schedule: Partial<Schedule>): Observable<Schedule> {
    // Normalize schedule for API
    const safeSchedule = this.normalizeScheduleForApi(schedule);
    
    return this.http.post<Schedule>(this.schedulesUrl, safeSchedule).pipe(
      tap((newSchedule: Schedule) => console.log(`Created schedule id=${newSchedule._id}`)),
      catchError(ErrorHandlingService.handleError<Schedule>('createSchedule'))
    );
  }
  
  /**
   * Update an existing schedule
   */
  updateSchedule(id: string, schedule: Partial<Schedule>): Observable<Schedule> {
    const safeId = IdUtils.ensureString(id);
    const url = `${this.schedulesUrl}/${safeId}`;
    
    // Normalize schedule for API
    const safeSchedule = this.normalizeScheduleForApi(schedule);
    
    return this.http.put<Schedule>(url, safeSchedule).pipe(
      tap(response => {
        console.log(`Updated schedule id=${safeId}`);
        
        // Verify shift count
        if (response.shifts?.length !== schedule.shifts?.length) {
          console.warn(
            `Shift count mismatch. Sent: ${schedule.shifts?.length}, Received: ${response.shifts?.length}`
          );
        }
      }),
      catchError(ErrorHandlingService.handleError<Schedule>(`updateSchedule id=${safeId}`))
    );
  }
  
  /**
   * Delete a schedule
   */
  deleteSchedule(id: string): Observable<boolean> {
    // Ensure ID is string format
    const safeId = IdUtils.ensureString(id);
    const url = `${this.schedulesUrl}/${safeId}`;
    
    return this.http.delete<boolean>(url).pipe(
      tap(_ => console.log(`Deleted schedule id=${safeId}`)),
      catchError(ErrorHandlingService.handleError<boolean>(`deleteSchedule id=${safeId}`))
    );
  }
  
  /**
   * Add shift to schedule
   */
  addShift(scheduleId: string, shift: ScheduleShift): Observable<Schedule> {
    // Ensure schedule ID is string format
    const safeScheduleId = IdUtils.ensureString(scheduleId);
    const url = `${this.schedulesUrl}/${safeScheduleId}/shifts`;
    
    // Normalize shift for API
    const safeShift = this.normalizeShiftForApi(shift);
    
    return this.http.post<Schedule>(url, safeShift).pipe(
      tap(_ => console.log(`Added shift to schedule id=${safeScheduleId}`)),
      catchError(ErrorHandlingService.handleError<Schedule>(`addShift scheduleId=${safeScheduleId}`))
    );
  }
  
  /**
   * Remove shift from schedule
   */
  removeShift(scheduleId: string, shiftId: string): Observable<Schedule> {
    // Ensure both IDs are string format
    const safeScheduleId = IdUtils.ensureString(scheduleId);
    const safeShiftId = IdUtils.ensureString(shiftId);
    
    const url = `${this.schedulesUrl}/${safeScheduleId}/shifts/${safeShiftId}`;
    
    return this.http.delete<Schedule>(url).pipe(
      tap(_ => console.log(`Removed shift id=${safeShiftId} from schedule id=${safeScheduleId}`)),
      catchError(ErrorHandlingService.handleError<Schedule>(`removeShift scheduleId=${safeScheduleId}, shiftId=${safeShiftId}`))
    );
  }

  /**
   * Get schedule for specific employee
   */
  getEmployeeSchedule(employeeId: string, startDate: string, endDate: string): Observable<ScheduleShift[]> {
    // Ensure employee ID is string format
    const safeEmployeeId = IdUtils.ensureString(employeeId);
    console.log(`getEmployeeSchedule: Requesting shifts for employee ID: ${safeEmployeeId}`);
    
    const params = new HttpParams()
      .set('start_date', startDate)
      .set('end_date', endDate);
    
    const url = `${this.schedulesUrl}/employee/${safeEmployeeId}/shifts`;
    
    return this.http.get<ScheduleShift[]>(url, { params }).pipe(
      tap(shifts => {
        console.log(`Received ${shifts.length} shifts from API for employee: ${safeEmployeeId}`);
        // Verify API is returning correct data
        shifts.forEach(shift => {
          if (IdUtils.ensureString(shift.employee_id) !== safeEmployeeId) {
            console.error('API returned shift for wrong employee:', shift);
          }
        });
      }),
      // Add an extra filter on the frontend just to be safe
      map(shifts => shifts.filter(shift => 
        IdUtils.ensureString(shift.employee_id) === safeEmployeeId
      )),
      //catchError(this.handleError<ScheduleShift[]>(`getEmployeeSchedule employeeId=${safeEmployeeId}`, []))
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
   * Get start of the week (Sunday) for a given date
   */
  getStartOfWeek(date: Date): Date {
    const result = new Date(date);
    const day = result.getDay();
    const diff = result.getDate() - day;
    result.setDate(diff);
    result.setHours(0, 0, 0, 0);
    return result;
  }

  /**
   * Get end of the week (Saturday) for a given date
   */
  getEndOfWeek(date: Date): Date {
    const result = new Date(date);
    const day = result.getDay();
    const diff = result.getDate() - day + 6;
    result.setDate(diff);
    result.setHours(23, 59, 59, 999);
    return result;
  }

  /**
   * Format total minutes as HH:MM string
   */
  formatTimeFromMinutes(minutes: number): string {
    if (!minutes && minutes !== 0) return '00:00';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }

  /**
   * Calculate time difference in minutes between two ISO datetime strings
   */
  calculateTimeDifference(startTime: string, endTime: string): number {
    if (!startTime || !endTime) return 0;
    
    try {
      return DateTimeUtils.calculateDurationMinutes(startTime, endTime);
    } catch (error) {
      console.error('Error calculating time difference:', error);
      return 0;
    }
  }

  /**
   * Normalize a time entry object for API requests
   */
  private normalizeTimeEntryForApi(entry: Partial<TimeEntry>): Partial<TimeEntry> {
    if (!entry) return {};
    
    const normalized: Partial<TimeEntry> = { ...entry };
    
    // Ensure IDs are strings
    if (normalized.employee_id) {
      normalized.employee_id = IdUtils.ensureString(normalized.employee_id);
    }
    
    if (normalized.store_id) {
      normalized.store_id = IdUtils.ensureString(normalized.store_id);
    }
    
    if (normalized.approved_by) {
      normalized.approved_by = IdUtils.ensureString(normalized.approved_by);
    }
    
    // Remove frontend-specific properties
    delete normalized.employee_name;
    delete normalized.store_name;
    
    return normalized;
  }

  /**
   * Normalize a timesheet object for API requests
   */
  private normalizeTimesheetForApi(timesheet: Partial<WeeklyTimesheet>): Partial<WeeklyTimesheet> {
    if (!timesheet) return {};
    
    const normalized: Partial<WeeklyTimesheet> = { ...timesheet };
    
    // Ensure IDs are strings
    if (normalized.employee_id) {
      normalized.employee_id = IdUtils.ensureString(normalized.employee_id);
    }
    
    if (normalized.store_id) {
      normalized.store_id = IdUtils.ensureString(normalized.store_id);
    }
    
    if (normalized.approved_by) {
      normalized.approved_by = IdUtils.ensureString(normalized.approved_by);
    }
    
    // Ensure time_entries array contains string IDs
    if (normalized.time_entries) {
      normalized.time_entries = normalized.time_entries.map(id => IdUtils.ensureString(id));
    }
    
    // Remove frontend-specific properties
    delete normalized.employee_name;
    delete normalized.store_name;
    
    return normalized;
  }

  /**
   * Normalize a schedule object for API requests
   */
  private normalizeScheduleForApi(schedule: Partial<Schedule>): Partial<Schedule> {
    if (!schedule) return {};
    
    const normalized: Partial<Schedule> = { ...schedule };
    
    // Ensure IDs are strings
    if (normalized.store_id) {
      normalized.store_id = IdUtils.ensureString(normalized.store_id);
    }
    
    if (normalized.created_by) {
      normalized.created_by = IdUtils.ensureString(normalized.created_by);
    }
    
    // Normalize shifts
    if (normalized.shifts) {
      normalized.shifts = normalized.shifts.map(shift => this.normalizeShiftForApi(shift));
    }
    
    // Remove frontend-specific properties
    delete normalized.store_name;
    
    return normalized;
  }

  /**
   * Normalize a shift object for API requests
   */
  private normalizeShiftForApi(shift: ScheduleShift): ScheduleShift {
    if (!shift) return {} as ScheduleShift;
    
    const normalized: ScheduleShift = {
      ...shift,
      employee_id: IdUtils.ensureString(shift.employee_id),
      date: shift.date,
      start_time: shift.start_time,
      end_time: shift.end_time
    };
    
    // Generate a shift ID if missing
    if (!normalized._id) {
      normalized._id = `shift_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    } else if (normalized._id.startsWith('temp_')) {
      // Replace temporary IDs with proper format
      normalized._id = `shift_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    }
    
    // Remove frontend-specific properties
    delete normalized.employee_name;
    
    return normalized;
  }

  /**
   * Enhance time entries with employee and store names
   */
  private enhanceTimeEntries(entries: TimeEntry[]): Observable<TimeEntry[]> {
    if (entries.length === 0) {
      return of([]);
    }
    
    const employeeIds = [...new Set(entries.map(entry => entry.employee_id))];
    const storeIds = [...new Set(entries.map(entry => entry.store_id))];
    
    return forkJoin({
      employees: this.employeeService.getEmployees(),
      stores: this.storeService.getStores()
    }).pipe(
      map(({ employees, stores }) => {
        return entries.map(entry => {
          const employee = employees.find(e => IdUtils.areEqual(e._id, entry.employee_id));
          const store = stores.find(s => IdUtils.areEqual(s._id, entry.store_id));
          
          return {
            ...entry,
            employee_name: employee?.full_name || 'Unknown',
            store_name: store?.name || 'Unknown'
          };
        });
      })
    );
  }

  /**
   * Enhance timesheets with employee and store names
   */
  private enhanceTimesheets(timesheets: WeeklyTimesheet[]): Observable<WeeklyTimesheet[]> {
    if (timesheets.length === 0) {
      return of([]);
    }
    
    const employeeIds = [...new Set(timesheets.map(sheet => sheet.employee_id))];
    const storeIds = [...new Set(timesheets.map(sheet => sheet.store_id))];
    
    return forkJoin({
      employees: this.employeeService.getEmployees(),
      stores: this.storeService.getStores()
    }).pipe(
      map(({ employees, stores }) => {
        return timesheets.map(timesheet => {
          const employee = employees.find(e => IdUtils.areEqual(e._id, timesheet.employee_id));
          const store = stores.find(s => IdUtils.areEqual(s._id, timesheet.store_id));
          
          return {
            ...timesheet,
            employee_name: employee?.full_name || 'Unknown',
            store_name: store?.name || 'Unknown'
          };
        });
      })
    );
  }

  /**
   * Enhance schedules with store names and employee names in shifts
   */
  private enhanceSchedules(schedules: Schedule[]): Observable<Schedule[]> {
    if (schedules.length === 0) {
      return of([]);
    }
    
    const storeIds = [...new Set(schedules.map(schedule => schedule.store_id))];
    const employeeIds = [...new Set(
      schedules.flatMap(schedule => 
        schedule.shifts.map(shift => shift.employee_id)
      )
    )];
    
    return forkJoin({
      employees: this.employeeService.getEmployees(),
      stores: this.storeService.getStores()
    }).pipe(
      map(({ employees, stores }) => {
        return schedules.map(schedule => {
          const store = stores.find(s => IdUtils.areEqual(s._id, schedule.store_id));
          
          // Enhance each shift with employee name
          const enhancedShifts = schedule.shifts.map(shift => {
            const employee = employees.find(e => IdUtils.areEqual(e._id, shift.employee_id));
            return {
              ...shift,
              employee_name: employee?.full_name || 'Unknown'
            };
          });
          
          return {
            ...schedule,
            store_name: store?.name || 'Unknown',
            shifts: enhancedShifts
          };
        });
      })
    );
  }
}