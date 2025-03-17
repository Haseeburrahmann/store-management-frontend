// src/app/core/services/hours.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, throwError, forkJoin } from 'rxjs';
import { catchError, tap, map, switchMap } from 'rxjs/operators';
import { WeeklyTimesheet, Schedule, ScheduleShift, TimesheetUtils, TimesheetConfig } from '../../shared/models/hours.model';
import { EmployeeService } from './employee.service';
import { StoreService } from './store.service';
import { AuthService } from '../auth/auth.service';
import { PermissionService } from '../auth/permission.service';
import { IdUtils } from '../utils/id-utils.service';
import { DateTimeUtils } from '../utils/date-time-utils.service';
import { ErrorHandlingService } from '../utils/error-handling.service';
import { Employee } from '../../shared/models/employee.model';

export interface TimesheetQueryParams {
  employee_id?: string;
  store_id?: string;
  start_date?: string;
  end_date?: string;
  status?: string;
  skip?: number;
  limit?: number;
  schedule_id?: string; // Add this for querying by schedule
}

interface EmployeeShiftResponse extends ScheduleShift {
  schedule_id?: string;
  schedule_title?: string;
  store_id?: string;
  store_name?: string;
}

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

  // ======== Helper Methods ========

  /**
   * Map API response to complete WeeklyTimesheet objects
   */
  private mapTimesheetResponse(timesheets: any[]): WeeklyTimesheet[] {
    return timesheets.map(timesheet => this.enrichTimesheet(timesheet));
  }

  /**
   * Enrich a single timesheet with missing data
   */
  private enrichTimesheet(timesheet: any): WeeklyTimesheet {
    // First, ensure we have a valid object
    if (!timesheet) {
      console.warn('Received null/undefined timesheet from API');
      return TimesheetUtils.ensureComplete({});
    }
    
    // Add store name if we have the store ID but name is missing
    if (timesheet.store_id && !timesheet.store_name) {
      this.storeService.getStoreById(timesheet.store_id).subscribe(store => {
        if (store) {
          timesheet.store_name = store.name;
        }
      });
    }
    
    // Add employee name if we have the employee ID but name is missing
    if (timesheet.employee_id && !timesheet.employee_name) {
      const currentUser = this.authService.currentUser;
      // If this is the current user's timesheet, use their name
      if (currentUser && currentUser._id === timesheet.employee_id) {
        timesheet.employee_name = currentUser.full_name || currentUser.email;
      } else {
        this.employeeService.getEmployeeById(timesheet.employee_id).subscribe(employee => {
          if (employee) {
            timesheet.employee_name = employee.full_name;
          }
        });
      }
    }
    
    // Ensure the timesheet is complete with all required fields
    return TimesheetUtils.ensureComplete(timesheet);
  }

  /**
   * Check if a timesheet already exists for the given week
   * @param startDate The Monday of the week to check
   * @returns Observable that emits true if a timesheet exists, false otherwise
   */
  private checkExistingTimesheet(startDate: string): Observable<boolean> {
    // Calculate end date (Sunday of the week)
    const start = new Date(startDate);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    
    // Format dates for API
    const formattedStart = DateTimeUtils.formatDateForAPI(start);
    const formattedEnd = DateTimeUtils.formatDateForAPI(end);

    // Query API to check for existing timesheets in this date range
    return this.getMyTimesheets({
      start_date: formattedStart,
      end_date: formattedEnd
    }).pipe(
      map(timesheets => timesheets.length > 0),
      catchError(error => {
        console.error('Error checking for existing timesheets:', error);
        return of(false); // Assume no existing timesheet if check fails
      })
    );
  }

  /**
   * Check if a timesheet already exists for the given schedule
   * @param scheduleId The schedule ID to check
   * @returns Observable that emits true if a timesheet exists, false otherwise
   */
  private checkExistingTimesheetForSchedule(scheduleId: string): Observable<boolean> {
    // Query API to check for existing timesheets with this schedule_id
    const params = new HttpParams().set('schedule_id', scheduleId);
    
    return this.http.get<any[]>(`${this.timesheetsUrl}`, { params }).pipe(
      map(timesheets => timesheets.length > 0),
      catchError(error => {
        console.error('Error checking for existing timesheets:', error);
        return of(false); // Assume no existing timesheet if check fails
      })
    );
  }
  
  /**
   * Check if the current user is an admin
   */
  private isAdminUser(): boolean {
    const currentUser = this.authService.currentUser;
    // Admin role ID
    return currentUser?.role_id === '67c9fb4d9db05f47c32b6b22';
  }
  
  // ======== Timesheet Methods ========
  
 /**
 * Improved version of getTimesheets with proper role-based filtering
 */
 getTimesheets(options: TimesheetQueryParams = {}): Observable<WeeklyTimesheet[]> {
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
  
  // Log params in a way that's compatible with all Angular versions
  const paramObj: {[key: string]: string} = {};
  params.keys().forEach(key => {
    paramObj[key] = params.get(key) || '';
  });
  console.log('Fetching timesheets with params:', paramObj);
  
  return this.http.get<any[]>(this.timesheetsUrl, { params }).pipe(
    map(timesheets => this.mapTimesheetResponse(timesheets)),
    tap(timesheets => console.log(`Fetched ${timesheets.length} timesheets`)),
    catchError(error => {
      console.error(`Error fetching timesheets: ${error.message}`);
      return of([]);
    })
  );
}
  
getMyTimesheets(options: {
  status?: string,
  start_date?: string,
  end_date?: string,
  skip?: number, 
  limit?: number
} = {}): Observable<WeeklyTimesheet[]> {
  let params = new HttpParams();
  
  if (options.status) params = params.set('status', options.status);
  if (options.start_date) params = params.set('start_date', options.start_date);
  if (options.end_date) params = params.set('end_date', options.end_date);
  if (options.skip !== undefined) params = params.set('skip', options.skip.toString());
  if (options.limit !== undefined) params = params.set('limit', options.limit.toString());
  
  // Log params in a way that's compatible with all Angular versions
  const paramObj: {[key: string]: string} = {};
  params.keys().forEach(key => {
    paramObj[key] = params.get(key) || '';
  });
  console.log('Fetching my timesheets with params:', paramObj);
  
  return this.http.get<any[]>(`${this.timesheetsUrl}/me`, { params }).pipe(
    map(timesheets => this.mapTimesheetResponse(timesheets)),
    tap(timesheets => console.log(`Fetched ${timesheets.length} of my timesheets`)),
    catchError(error => {
      // If we get an error, log it and return empty array to avoid breaking the UI
      console.error(`Error fetching my timesheets: ${error.message}`);
      return of([]);
    })
  );
}
  
  /**
   * Get current week's timesheet for the current user
   */
  getCurrentTimesheet(): Observable<WeeklyTimesheet | null> {
    console.log('Fetching current timesheet');
    
    return this.http.get<WeeklyTimesheet>(`${this.timesheetsUrl}/me/current`).pipe(
      tap(timesheet => console.log('Fetched current week timesheet')),
      catchError(error => {
        // Improved error handling with more specific messages
        if (error.status === 404) {
          console.log('No current timesheet found (404 response). This is expected for new users or at the beginning of a pay period.');
          return of(null);
        } else if (error.status === 401 || error.status === 403) {
          console.error('Authentication or permission error when fetching current timesheet:', error);
          return throwError(() => new Error('You do not have permission to access the current timesheet.'));
        } else if (error.status >= 500) {
          console.error('Server error when fetching current timesheet:', error);
          return throwError(() => new Error('Server error occurred. Please try again later.'));
        }
        
        // For other errors, log but still return null to avoid breaking the UI
        console.error(`Error fetching current timesheet: ${error.message}`);
        return of(null);
      })
    );
  }
  
  /**
   * Enhanced getTimesheet method that enriches the response
   */
  getTimesheet(id: string): Observable<WeeklyTimesheet> {
    // Ensure ID is string format
    const safeId = IdUtils.ensureString(id);
    
    if (!safeId) {
      return throwError(() => new Error('Invalid timesheet ID provided'));
    }
    
    return this.http.get<any>(`${this.timesheetsUrl}/${safeId}`).pipe(
      map(timesheet => this.enrichTimesheet(timesheet)),
      tap(timesheet => console.log(`Fetched timesheet id=${safeId}`)),
      catchError(error => {
        if (error.status === 404) {
          console.error(`Timesheet with ID ${safeId} not found`);
          return throwError(() => new Error(`Timesheet not found. It may have been deleted or you may not have access.`));
        } else if (error.status === 401 || error.status === 403) {
          console.error(`Permission denied for timesheet ${safeId}:`, error);
          return throwError(() => new Error('You do not have permission to access this timesheet.'));
        }
        
        console.error(`Error fetching timesheet ${safeId}:`, error);
        return throwError(() => new Error(`Failed to load timesheet: ${error.message}`));
      })
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
   * Start a timesheet for a past week
   * @param startDate The Monday of the week to create a timesheet for
   * @param storeId The store ID
   * @returns Observable with the created timesheet
   */
  startPastTimesheet(weekStartDate: string, storeId: string): Observable<WeeklyTimesheet> {
    // Validate the date is a valid past week date
    const validation = TimesheetUtils.canCreateTimesheetForWeek(weekStartDate);
    if (!validation.isValid) {
      return throwError(() => new Error(validation.message));
    }
  
    // Check if a timesheet already exists for this week
    return this.checkExistingTimesheet(weekStartDate).pipe(
      switchMap(exists => {
        if (exists) {
          return throwError(() => new Error('A timesheet already exists for this week.'));
        }
  
        // Create a new timesheet for the past week
        const safeStoreId = IdUtils.ensureString(storeId);
        
        // Use consistent parameter naming - 'week_start_date' instead of 'weekstart_date'
        const params = new HttpParams()
          .set('store_id', safeStoreId)
          .set('week_start_date', weekStartDate);
  
        return this.http.post<WeeklyTimesheet>(`${this.timesheetsUrl}/me/start-past`, {}, { params }).pipe(
          tap((timesheet: WeeklyTimesheet) => console.log(`Created past timesheet id=${timesheet._id}`)),
          catchError(error => {
            // Enhanced error logging
            console.error('Error creating past timesheet:', error);
            if (error.status === 404) {
              return throwError(() => new Error('Failed to create past timesheet: Endpoint not found. Check if the API supports this feature.'));
            } else if (error.status === 400) {
              // Extract the specific validation error message if available
              const errorMsg = error.error?.detail || error.message || 'Validation error';
              return throwError(() => new Error(`Failed to create past timesheet: ${errorMsg}`));
            }
            return throwError(() => new Error(`Failed to create past timesheet: ${error.message}`));
          })
        );
      })
    );
  }

  /**
   * Create a timesheet from a completed schedule
   * @param scheduleId The ID of the completed schedule
   * @returns Observable with the created timesheet
   */
  createTimesheetFromSchedule(scheduleId: string): Observable<WeeklyTimesheet> {
    // Ensure ID is string format
    const safeId = IdUtils.ensureString(scheduleId);
    
    // First, check if schedule is completed
    return this.getSchedule(safeId).pipe(
      switchMap(schedule => {
        if (schedule.status !== 'completed') {
          return throwError(() => new Error('Cannot create timesheet: Schedule is not marked as completed.'));
        }
  
        // Check if the schedule is within grace period
        const validation = TimesheetUtils.canCreateTimesheetForWeek(schedule.week_start_date);
        if (!validation.isValid) {
          return throwError(() => new Error(validation.message));
        }
  
        // Check if a timesheet already exists for this schedule
        return this.checkExistingTimesheetForSchedule(safeId).pipe(
          switchMap(exists => {
            if (exists) {
              return throwError(() => new Error('A timesheet already exists for this schedule.'));
            }
  
            // Create the timesheet based on the schedule
            return this.http.post<WeeklyTimesheet>(`${this.timesheetsUrl}/from-schedule/${safeId}`, {}).pipe(
              tap((timesheet: WeeklyTimesheet) => console.log(`Created timesheet from schedule id=${timesheet._id}`)),
              catchError(error => {
                console.error('Error creating timesheet from schedule:', error);
                return throwError(() => new Error(`Failed to create timesheet: ${error.message}`));
              })
            );
          })
        );
      })
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
   * Get a specific schedule by ID with improved error handling and ID validation
   */
  getSchedule(id: string): Observable<Schedule> {
    // Validate the ID before sending the request
    if (!id || typeof id !== 'string') {
      console.error(`Invalid schedule ID provided: ${id}, type: ${typeof id}`);
      return throwError(() => new Error('Invalid schedule ID format'));
    }
    
    // Check if the ID appears to be a shift ID instead of a schedule ID
    if (id.includes('shift')) {
      console.error(`Possible shift ID detected instead of schedule ID: ${id}`);
      return throwError(() => new Error('Invalid schedule ID - appears to be a shift ID'));
    }
    
    // Ensure ID is string format
    const safeId = IdUtils.ensureString(id);
    
    console.log(`Fetching schedule with ID: ${safeId}`);
    
    return this.http.get<Schedule>(`${this.schedulesUrl}/${safeId}`).pipe(
      tap(schedule => {
        if (schedule) {
          console.log(`Successfully fetched schedule ${schedule.title} with ${schedule.shifts?.length || 0} shifts`);
        }
      }),
      catchError(error => {
        console.error(`Error fetching schedule id=${safeId}:`, error);
        
        // If we got a 404, it might be because we're using a shift ID instead of a schedule ID
        if (error.status === 404) {
          console.error(`Schedule not found. Check if the ID ${safeId} is actually a shift ID.`);
        }
        
        return throwError(() => error);
      })
    );
  }

  /**
   * Extract a valid schedule ID from a potentially complex object (schedule or shift)
   * to prevent ID confusion
   */
  extractScheduleId(obj: any): string | null {
    if (!obj) return null;
    
    // If it's a schedule object with an _id
    if (obj._id && (obj.shifts || obj.week_start_date)) {
      return obj._id;
    }
    
    // If it's a shift with a schedule_id reference
    if (obj.schedule_id) {
      return obj.schedule_id;
    }
    
    return null;
  }
    
  /**
   * Create a new schedule
   */
  createSchedule(schedule: Partial<Schedule>): Observable<Schedule> {
    // Set status to 'pending' if not provided
    if (!schedule.status) {
      schedule.status = 'pending';
    }
    
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
   * Mark a schedule as completed
   * @param id The schedule ID
   * @returns Observable with the updated schedule
   */
  markScheduleAsCompleted(id: string): Observable<Schedule> {
    // Ensure ID is string format
    const safeId = IdUtils.ensureString(id);
    
    return this.getSchedule(safeId).pipe(
      switchMap(schedule => {
        if (schedule.status === 'completed') {
          return of(schedule); // Already completed, return as is
        }
        
        // Update the schedule status to completed
        const currentUserId = this.authService.currentUser?._id;
        const updateData: Partial<Schedule> = {
          status: 'completed',
          completed_at: new Date().toISOString(),
          completed_by: currentUserId
        };
        
        return this.updateSchedule(safeId, updateData);
      }),
      catchError(error => {
        console.error(`Error marking schedule as completed: ${error.message}`);
        return throwError(() => error);
      })
    );
  }

  /**
   * Mark a schedule as active (in-progress)
   * @param id The schedule ID
   * @returns Observable with the updated schedule
   */
  markScheduleAsActive(id: string): Observable<Schedule> {
    // Ensure ID is string format
    const safeId = IdUtils.ensureString(id);
    
    return this.updateSchedule(safeId, { status: 'active' });
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
    
  /**
   * Get current employee ID from the authenticated user
   * Returns an Observable that emits the employee ID or null if no employee record exists
   */
  public getCurrentEmployeeId(): Observable<string | null> {
    console.log('Getting current employee ID using employees/me endpoint');
    
    // Get the current user
    const currentUser = this.authService.currentUser;
    if (!currentUser) {
      console.error('No authenticated user found');
      return of(null);
    }
    
    console.log('Current user:', currentUser.email, 'User ID:', currentUser._id);
    
    // If user is admin, they don't have an employee record
    if (this.permissionService.isAdmin()) {
      console.log('User is an admin without employee record');
      return of(null);
    }
    
    // Use the EmployeeService to get the current employee profile
    return this.http.get<Employee>('/api/v1/employees/me').pipe(
      map(employee => {
        if (employee) {
          console.log(`Found employee record for current user: ID ${employee._id}, Name: ${employee.full_name}`);
          return employee._id;
        } else {
          console.error('No employee record found for current user');
          return null;
        }
      }),
      catchError(error => {
        console.error('Error fetching current employee record:', error);
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

  /**
   * Improved getCurrentSchedule method with better role-based handling
   */
  getCurrentSchedule(): Observable<Schedule | null> {
    console.log('Fetching current schedule, user role:', this.permissionService.getRoleIdentifier());
    
    // For admins and managers - use the regular schedule endpoint
    if (this.permissionService.isAdmin() || this.permissionService.isManager()) {
      console.log('Admin/Manager: Fetching schedule via regular endpoint');
      
      // Calculate current week dates
      const today = new Date();
      const currentWeekStart = this.getStartOfWeek(today);
      const currentWeekEnd = this.getEndOfWeek(today);
      const startDate = DateTimeUtils.formatDateForAPI(currentWeekStart);
      const endDate = DateTimeUtils.formatDateForAPI(currentWeekEnd);
      
      return this.getSchedules({
        start_date: startDate,
        end_date: endDate,
        limit: 1
      }).pipe(
        map(schedules => {
          if (schedules && schedules.length > 0) {
            console.log(`Found current week schedule with ${schedules[0].shifts?.length || 0} shifts`);
            
            // Ensure the schedule has a shift_count property
            const schedule = schedules[0];
            if (Array.isArray(schedule.shifts)) {
              schedule.shift_count = schedule.shifts.length;
            }
            
            // Set default status if not present (for backward compatibility)
            if (!schedule.status) {
              schedule.status = 'pending';
            }
            
            return schedule;
          }
          return null;
        }),
        catchError(error => {
          console.error('Error fetching schedules:', error);
          return of(null);
        })
      );
    }
    
    // For employees - use the employee/me endpoint
    console.log('Employee: Using employee/me endpoint directly');
    
    // Direct API call to get employee shifts
    return this.http.get<EmployeeShiftResponse[]>(`${this.schedulesUrl}/employee/me`).pipe(
      tap(shifts => console.log(`Got ${shifts.length} shifts from employee/me endpoint`)),
      map(shifts => {
        if (!shifts || shifts.length === 0) {
          console.log('No shifts found from employee/me endpoint');
          return null;
        }
        
        // Log first shift for debugging
        console.log('First shift from API:', shifts[0]);
        
        // Add employee_name if missing
        shifts.forEach(shift => {
          if (!shift.employee_name) {
            // Try to get employee name from auth service
            const currentUser = this.authService.currentUser;
            if (currentUser) {
              shift.employee_name = currentUser.full_name || currentUser.email || 'Current Employee';
            } else {
              shift.employee_name = 'Current Employee';
            }
          }
        });
        
        // Extract common schedule data from the first shift
        const firstShift = shifts[0];
        const scheduleId = firstShift.schedule_id || '';
        const storeId = firstShift.store_id || '';
        const storeName = firstShift.store_name || '';
        const scheduleTitle = firstShift.schedule_title || 'Current Schedule';
        
        console.log(`Creating schedule object from shifts. Schedule ID: ${scheduleId}, Store: ${storeName}`);
        
        // Calculate week dates based on the day of the first shift
        const today = new Date();
        const weekStart = this.getStartOfWeek(today);
        const weekEnd = this.getEndOfWeek(today);
        
        // Build a Schedule object from the shifts
        const schedule: Schedule = {
          _id: scheduleId,
          title: scheduleTitle,
          store_id: storeId,
          store_name: storeName,
          week_start_date: DateTimeUtils.formatDateForAPI(weekStart),
          week_end_date: DateTimeUtils.formatDateForAPI(weekEnd),
          shifts: shifts as unknown as ScheduleShift[],
          shift_count: shifts.length, // Ensure shift_count property is set
          created_by: '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          // Default to 'active' status for employee schedules
          status: 'active'
        };
        
        console.log(`Created schedule with ${shifts.length} shifts`);
        return schedule;
      }),
      catchError(error => {
        console.error('Error fetching employee shifts:', error);
        return of(null);
      })
    );
  }

  /**
   * Get available past weeks for timesheet creation
   * Returns an array of week objects that are within the grace period
   */
  getPastWeeksForTimesheets(): Observable<Array<{
    startDate: Date;
    endDate: Date;
    weekNumber: number;
    year: number;
    label: string;
    isWithinGracePeriod: boolean;
    remainingDays: number;
  }>> {
    return this.getCurrentEmployeeId().pipe(
      switchMap(employeeId => {
        if (!employeeId) {
          return of([]);
        }

        // Get current date
        const today = new Date();
        const result = [];
        
        // Get the start of the current week (Monday)
        const currentWeekStart = DateTimeUtils.getStartOfWeek(today);
        
        // Add past weeks up to the maximum
        for (let i = 1; i <= TimesheetConfig.MAX_PAST_WEEKS; i++) {
          const weekStart = new Date(currentWeekStart);
          weekStart.setDate(currentWeekStart.getDate() - (i * 7));
          
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekStart.getDate() + 6);
          
          // Check if this week is within the grace period
          const isWithinGracePeriod = TimesheetUtils.isWithinGracePeriod(weekEnd);
          const remainingDays = TimesheetUtils.getRemainingGracePeriodDays(weekEnd);
          
          // Only include weeks that are within the grace period and have no existing timesheet
          const weekStartStr = DateTimeUtils.formatDateForAPI(weekStart);
          const weekEndStr = DateTimeUtils.formatDateForAPI(weekEnd);
          
          result.push({
            startDate: weekStart,
            endDate: weekEnd,
            weekNumber: DateTimeUtils.getWeekNumber(weekStart),
            year: weekStart.getFullYear(),
            label: `Week ${DateTimeUtils.getWeekNumber(weekStart)} (${DateTimeUtils.formatDateForDisplay(weekStart.toISOString())} - ${DateTimeUtils.formatDateForDisplay(weekEnd.toISOString())})`,
            isWithinGracePeriod,
            remainingDays
          });
        }
        
        // Check if timesheets already exist for any of these weeks
        return forkJoin(
          result.map(week => 
            this.checkExistingTimesheet(DateTimeUtils.formatDateForAPI(week.startDate))
              .pipe(map(exists => ({ week, exists })))
          )
        ).pipe(
          map(results => 
            results
              .filter(item => !item.exists && item.week.isWithinGracePeriod)
              .map(item => item.week)
          )
        );
      })
    );
  }
  
  // Method for finding schedules in a certain week that are completed but don't have timesheets
  getCompletedSchedulesWithoutTimesheets(startDate: string, endDate: string): Observable<Schedule[]> {
    // Get all schedules for the week
    return this.getSchedules({
      start_date: startDate,
      end_date: endDate
    }).pipe(
      switchMap(schedules => {
        // Filter for completed schedules
        const completedSchedules = schedules.filter(s => s.status === 'completed');
        
        if (completedSchedules.length === 0) {
          return of([]);
        }
        
        // Check which ones don't have timesheets
        return forkJoin(
          completedSchedules.map(schedule => 
            this.checkExistingTimesheetForSchedule(schedule._id || '')
              .pipe(map(exists => ({ schedule, exists })))
          )
        ).pipe(
          map(results => 
            results
              .filter(item => !item.exists)
              .map(item => item.schedule)
          )
        );
      }),
      catchError(error => {
        console.error('Error finding completed schedules without timesheets:', error);
        return of([]);
      })
    );
  }
  
  // Get employee schedules for all past weeks within the grace period
  getEmployeeAllSchedules(employeeId: string, options: any = {}): Observable<Schedule[]> {
    let params = new HttpParams();
    
    if (options.start_date) {
      params = params.set('start_date', options.start_date);
    }
    
    if (options.end_date) {
      params = params.set('end_date', options.end_date);
    }
    
    if (options.skip !== undefined) {
      params = params.set('skip', options.skip.toString());
    }
    
    if (options.limit !== undefined) {
      params = params.set('limit', options.limit.toString());
    }
    
    return this.http.get<Schedule[]>(`/api/v1/schedules/employee/${employeeId}/all`, { params });
  }

  /**
 * Get employee shifts for the current schedule (for the currently logged in employee)
 * @param scheduleId Optional schedule ID to filter shifts 
 * @param weekStartDate Optional week start date to filter shifts
 * @returns Observable of employee shifts
 */
getMyScheduleShifts(scheduleId?: string, weekStartDate?: string): Observable<ScheduleShift[]> {
  console.log('Fetching employee shifts' + 
              (scheduleId ? ` for schedule: ${scheduleId}` : '') +
              (weekStartDate ? ` for week starting: ${weekStartDate}` : ''));
  
  // Build params
  let params = new HttpParams();
  
  if (scheduleId) {
    params = params.set('schedule_id', scheduleId);
  } else if (weekStartDate) {
    // If a specific week start date is provided, use it
    params = params.set('week_start_date', weekStartDate);
    
    // Calculate week end date (6 days after start)
    const startDate = new Date(weekStartDate);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);
    
    const endDateStr = endDate.toISOString().split('T')[0];
    console.log(`Using week range: ${weekStartDate} to ${endDateStr}`);
  } else {
    // If no specific schedule ID or week, use current week date range
    const today = new Date();
    
    // Get Monday of current week (start of week)
    const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const monday = new Date(today);
    monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    monday.setHours(0, 0, 0, 0);
    
    // Get Sunday of current week (end of week)
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);
    
    console.log(`Using current week date range: ${monday.toISOString().split('T')[0]} to ${sunday.toISOString().split('T')[0]}`);
    
    params = params
      .set('start_date', monday.toISOString().split('T')[0])
      .set('end_date', sunday.toISOString().split('T')[0]);
  }
  
  const currentUser = this.authService.currentUser;
  
  return this.http.get<ScheduleShift[]>(`${this.schedulesUrl}/employee/me`, { params }).pipe(
    tap(shifts => {
      console.log(`Received ${shifts.length} shifts from employee/me endpoint`);
      
      // Ensure every shift has proper employee_name and employee_id
      shifts.forEach((shift, index) => {
        if (!shift.employee_name && currentUser) {
          shift.employee_name = currentUser.full_name || currentUser.email || 'Current Employee';
        }
        
        console.log(`Shift ${index + 1}: Day=${shift.day_of_week}, Time=${shift.start_time}-${shift.end_time}, Employee=${shift.employee_name || 'Unknown'}`);
      });
    }),
    catchError(error => {
      console.error('Error fetching employee shifts:', error);
      return of([]);
    })
  );
}

}