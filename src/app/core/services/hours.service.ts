

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, forkJoin, throwError } from 'rxjs';
import { catchError, tap, map, switchMap } from 'rxjs/operators';
import { TimeEntry, WeeklyTimesheet, Schedule, ScheduleShift } from '../../shared/models/hours.model';
import { EmployeeService } from './employee.service';
import { StoreService } from './store.service';
import { AuthService } from '../auth/auth.service';
import { PermissionService } from '../auth/permission.service';

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
    
    let params = new HttpParams();
    
    if (options.employee_id) params = params.set('employee_id', options.employee_id);
    if (options.store_id) params = params.set('store_id', options.store_id);
    if (options.start_date) params = params.set('start_date', options.start_date);
    if (options.end_date) params = params.set('end_date', options.end_date);
    if (options.status) params = params.set('status', options.status);
    if (options.skip !== undefined) params = params.set('skip', options.skip.toString());
    if (options.limit !== undefined) params = params.set('limit', options.limit.toString());
    
    return this.http.get<TimeEntry[]>(this.timeEntriesUrl, { params }).pipe(
      tap(entries => console.log(`Fetched ${entries.length} time entries`)),
      switchMap(entries => this.enhanceTimeEntries(entries)),
      catchError(this.handleError<TimeEntry[]>('getTimeEntries', []))
    );
  }
  
  /**
   * Get a specific time entry by ID
   */
  getTimeEntry(id: string): Observable<TimeEntry> {
    // Ensure ID is string format
    const safeId = id.toString();
    const url = `${this.timeEntriesUrl}/${safeId}`;
    
    return this.http.get<TimeEntry>(url).pipe(
      tap(_ => console.log(`Fetched time entry id=${safeId}`)),
      switchMap(entry => this.enhanceTimeEntries([entry]).pipe(
        map(entries => entries[0])
      )),
      catchError(this.handleError<TimeEntry>(`getTimeEntry id=${safeId}`))
    );
  }
  
  /**
   * Create a new time entry
   */
  createTimeEntry(entry: Partial<TimeEntry>): Observable<TimeEntry> {
    // Make sure store_id and employee_id are strings
    const safeEntry = { ...entry };
    if (safeEntry.store_id) safeEntry.store_id = safeEntry.store_id.toString();
    if (safeEntry.employee_id) safeEntry.employee_id = safeEntry.employee_id.toString();
    
    return this.http.post<TimeEntry>(this.timeEntriesUrl, safeEntry).pipe(
      tap((newEntry: TimeEntry) => console.log(`Created time entry id=${newEntry._id}`)),
      catchError(this.handleError<TimeEntry>('createTimeEntry'))
    );
  }
  
  /**
   * Update an existing time entry
   */
  updateTimeEntry(id: string, entry: Partial<TimeEntry>): Observable<TimeEntry> {
    // Ensure ID is string format
    const safeId = id.toString();
    const url = `${this.timeEntriesUrl}/${safeId}`;
    
    // Make sure any IDs in the update are strings
    const safeEntry = { ...entry };
    if (safeEntry.store_id) safeEntry.store_id = safeEntry.store_id.toString();
    if (safeEntry.employee_id) safeEntry.employee_id = safeEntry.employee_id.toString();
    if (safeEntry.approved_by) safeEntry.approved_by = safeEntry.approved_by.toString();
    
    return this.http.put<TimeEntry>(url, safeEntry).pipe(
      tap(_ => console.log(`Updated time entry id=${safeId}`)),
      catchError(this.handleError<TimeEntry>(`updateTimeEntry id=${safeId}`))
    );
  }
  
  /**
   * Delete a time entry
   */
  deleteTimeEntry(id: string): Observable<boolean> {
    // Ensure ID is string format
    const safeId = id.toString();
    const url = `${this.timeEntriesUrl}/${safeId}`;
    
    return this.http.delete<boolean>(url).pipe(
      tap(_ => console.log(`Deleted time entry id=${safeId}`)),
      catchError(this.handleError<boolean>(`deleteTimeEntry id=${safeId}`))
    );
  }
  
  /**
   * Clock in for the current user
   */
  clockIn(storeId: string, notes?: string): Observable<TimeEntry> {
    // Ensure store ID is string format
    const safeStoreId = storeId.toString();
    
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
    const safeId = entryId.toString();
    
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
    // Get pending entries for this employee
    let params = new HttpParams()
      .set('employee_id', employeeId)
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
          console.log(`Found active time entry for employee id=${employeeId}`);
        } else {
          console.log(`No active time entry found for employee id=${employeeId}`);
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
    const safeId = id.toString();
    const url = `${this.timeEntriesUrl}/${safeId}/approve`;
    
    // Match the backend HourApproval schema
    const approvalData = {
      status: 'approved',
      notes: ''
    };
    
    return this.http.put<TimeEntry>(url, approvalData).pipe(
      tap(_ => console.log(`Approved time entry id=${safeId}`)),
      catchError(this.handleError<TimeEntry>(`approveTimeEntry id=${safeId}`))
    );
  }
  
  /**
   * Reject a time entry with reason
   */
  rejectTimeEntry(id: string, reason: string): Observable<TimeEntry> {
    // Ensure ID is string format
    const safeId = id.toString();
    const url = `${this.timeEntriesUrl}/${safeId}/approve`;
    
    // Match the backend HourApproval schema
    const rejectionData = {
      status: 'rejected',
      notes: reason
    };
    
    return this.http.put<TimeEntry>(url, rejectionData).pipe(
      tap(_ => console.log(`Rejected time entry id=${safeId}`)),
      catchError(this.handleError<TimeEntry>(`rejectTimeEntry id=${safeId}`))
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
    
    let params = new HttpParams();
    
    // Ensure all IDs are string format
    if (options.employee_id) params = params.set('employee_id', options.employee_id.toString());
    if (options.store_id) params = params.set('store_id', options.store_id.toString());
    if (options.start_date) params = params.set('start_date', options.start_date);
    if (options.end_date) params = params.set('end_date', options.end_date);
    if (options.status) params = params.set('status', options.status);
    if (options.skip !== undefined) params = params.set('skip', options.skip.toString());
    if (options.limit !== undefined) params = params.set('limit', options.limit.toString());
    
    return this.http.get<WeeklyTimesheet[]>(this.timesheetsUrl, { params }).pipe(
      tap(timesheets => console.log(`Fetched ${timesheets.length} timesheets`)),
      switchMap(timesheets => this.enhanceTimesheets(timesheets)),
      catchError(this.handleError<WeeklyTimesheet[]>('getTimesheets', []))
    );
  }
  
  /**
   * Get a specific timesheet by ID
   */
  getTimesheet(id: string): Observable<WeeklyTimesheet> {
    // Ensure ID is string format
    const safeId = id.toString();
    const url = `${this.timesheetsUrl}/${safeId}`;
    
    return this.http.get<WeeklyTimesheet>(url).pipe(
      tap(_ => console.log(`Fetched timesheet id=${safeId}`)),
      switchMap(timesheet => this.enhanceTimesheets([timesheet]).pipe(
        map(timesheets => timesheets[0])
      )),
      catchError(this.handleError<WeeklyTimesheet>(`getTimesheet id=${safeId}`))
    );
  }
  
  /**
   * Create a new timesheet
   */
  createTimesheet(timesheet: Partial<WeeklyTimesheet>): Observable<WeeklyTimesheet> {
    // Make sure all IDs are strings
    const safeTimesheet = { ...timesheet };
    if (safeTimesheet.employee_id) safeTimesheet.employee_id = safeTimesheet.employee_id.toString();
    if (safeTimesheet.store_id) safeTimesheet.store_id = safeTimesheet.store_id.toString();
    
    // Ensure time_entries array contains string IDs
    if (safeTimesheet.time_entries) {
      safeTimesheet.time_entries = safeTimesheet.time_entries.map(id => id.toString());
    }
    
    return this.http.post<WeeklyTimesheet>(this.timesheetsUrl, safeTimesheet).pipe(
      tap((newTimesheet: WeeklyTimesheet) => console.log(`Created timesheet id=${newTimesheet._id}`)),
      catchError(this.handleError<WeeklyTimesheet>('createTimesheet'))
    );
  }
  
  /**
   * Update an existing timesheet
   */
  updateTimesheet(id: string, timesheet: Partial<WeeklyTimesheet>): Observable<WeeklyTimesheet> {
    // Ensure ID is string format
    const safeId = id.toString();
    const url = `${this.timesheetsUrl}/${safeId}`;
    
    // Make sure all IDs are strings
    const safeTimesheet = { ...timesheet };
    if (safeTimesheet.employee_id) safeTimesheet.employee_id = safeTimesheet.employee_id.toString();
    if (safeTimesheet.store_id) safeTimesheet.store_id = safeTimesheet.store_id.toString();
    if (safeTimesheet.approved_by) safeTimesheet.approved_by = safeTimesheet.approved_by.toString();
    
    // Ensure time_entries array contains string IDs
    if (safeTimesheet.time_entries) {
      safeTimesheet.time_entries = safeTimesheet.time_entries.map(id => id.toString());
    }
    
    return this.http.put<WeeklyTimesheet>(url, safeTimesheet).pipe(
      tap(_ => console.log(`Updated timesheet id=${safeId}`)),
      catchError(this.handleError<WeeklyTimesheet>(`updateTimesheet id=${safeId}`))
    );
  }
  
  /**
   * Delete a timesheet
   */
  deleteTimesheet(id: string): Observable<boolean> {
    // Ensure ID is string format
    const safeId = id.toString();
    const url = `${this.timesheetsUrl}/${safeId}`;
    
    return this.http.delete<boolean>(url).pipe(
      tap(_ => console.log(`Deleted timesheet id=${safeId}`)),
      catchError(this.handleError<boolean>(`deleteTimesheet id=${safeId}`))
    );
  }
  
  /**
   * Submit a timesheet for approval
   */
  submitTimesheet(id: string, notes?: string): Observable<WeeklyTimesheet> {
    // Ensure ID is string format
    const safeId = id.toString();
    const url = `${this.timesheetsUrl}/${safeId}/submit`;
    
    // Match the backend TimesheetSubmit schema
    const submitData = { notes };
    
    return this.http.post<WeeklyTimesheet>(url, submitData).pipe(
      tap(_ => console.log(`Submitted timesheet id=${safeId}`)),
      catchError(this.handleError<WeeklyTimesheet>(`submitTimesheet id=${safeId}`))
    );
  }
  
  /**
   * Approve a timesheet
   */
  approveTimesheet(id: string, notes?: string): Observable<WeeklyTimesheet> {
    // Ensure ID is string format
    const safeId = id.toString();
    const url = `${this.timesheetsUrl}/${safeId}/approve`;
    
    // Match the backend TimesheetApproval schema
    const approvalData = {
      status: 'approved',
      notes: notes || ''
    };
    
    return this.http.post<WeeklyTimesheet>(url, approvalData).pipe(
      tap(_ => console.log(`Approved timesheet id=${safeId}`)),
      catchError(this.handleError<WeeklyTimesheet>(`approveTimesheet id=${safeId}`))
    );
  }
  
  /**
   * Reject a timesheet with reason
   */
  rejectTimesheet(id: string, reason: string): Observable<WeeklyTimesheet> {
    // Ensure ID is string format
    const safeId = id.toString();
    const url = `${this.timesheetsUrl}/${safeId}/approve`;
    
    // Match the backend TimesheetApproval schema
    const rejectionData = {
      status: 'rejected',
      notes: reason
    };
    
    return this.http.post<WeeklyTimesheet>(url, rejectionData).pipe(
      tap(_ => console.log(`Rejected timesheet id=${safeId}`)),
      catchError(this.handleError<WeeklyTimesheet>(`rejectTimesheet id=${safeId}`))
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
    const safeEmployeeId = employeeId.toString();
    
    // Use the me/current endpoint from the backend
    const url = `${this.timesheetsUrl}/me/current`;
    
    return this.http.get<WeeklyTimesheet>(url).pipe(
      tap(timesheet => console.log(`Fetched current timesheet for employee id=${safeEmployeeId}`)),
      catchError(error => {
        // If 404 (no current timesheet), return null instead of error
        if (error.status === 404) {
          return of(null);
        }
        return this.handleError<WeeklyTimesheet | null>('getCurrentTimesheet', null)(error);
      })
    );
  }
  
  /**
   * Add a time entry to a timesheet
   */
  addTimeEntryToTimesheet(timesheetId: string, timeEntryId: string): Observable<WeeklyTimesheet> {
    // Ensure both IDs are string format
    const safeTimesheetId = timesheetId.toString();
    const safeTimeEntryId = timeEntryId.toString();
    
    const url = `${this.timesheetsUrl}/${safeTimesheetId}/time-entries/${safeTimeEntryId}`;
    
    return this.http.post<WeeklyTimesheet>(url, {}).pipe(
      tap(_ => console.log(`Added time entry ${safeTimeEntryId} to timesheet ${safeTimesheetId}`)),
      catchError(this.handleError<WeeklyTimesheet>(`addTimeEntryToTimesheet`))
    );
  }
  
  /**
   * Remove a time entry from a timesheet
   */
  removeTimeEntryFromTimesheet(timesheetId: string, timeEntryId: string): Observable<WeeklyTimesheet> {
    // Ensure both IDs are string format
    const safeTimesheetId = timesheetId.toString();
    const safeTimeEntryId = timeEntryId.toString();
    
    const url = `${this.timesheetsUrl}/${safeTimesheetId}/time-entries/${safeTimeEntryId}`;
    
    return this.http.delete<WeeklyTimesheet>(url).pipe(
      tap(_ => console.log(`Removed time entry ${safeTimeEntryId} from timesheet ${safeTimesheetId}`)),
      catchError(this.handleError<WeeklyTimesheet>(`removeTimeEntryFromTimesheet`))
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
    const safeEmployeeId = employeeId.toString();
    const safeStoreId = storeId.toString();
    
    const url = `${this.timesheetsUrl}/generate`;
    const params = new HttpParams()
      .set('employee_id', safeEmployeeId)
      .set('store_id', safeStoreId)
      .set('start_date', startDate)
      .set('end_date', endDate);
    
    return this.http.post<WeeklyTimesheet>(url, null, { params }).pipe(
      tap(_ => console.log(`Generated timesheet for employee ${safeEmployeeId}`)),
      catchError(this.handleError<WeeklyTimesheet>(`generateTimesheet`))
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
    let params = new HttpParams();
    
    // Ensure store ID is string format
    if (options.store_id) params = params.set('store_id', options.store_id.toString());
    if (options.start_date) params = params.set('start_date', options.start_date);
    if (options.end_date) params = params.set('end_date', options.end_date);
    if (options.skip !== undefined) params = params.set('skip', options.skip.toString());
    if (options.limit !== undefined) params = params.set('limit', options.limit.toString());
    
    return this.http.get<Schedule[]>(this.schedulesUrl, { params }).pipe(
      tap(schedules => console.log(`Fetched ${schedules.length} schedules`)),
      switchMap(schedules => this.enhanceSchedules(schedules)),
      catchError(this.handleError<Schedule[]>('getSchedules', []))
    );
  }
  
  /**
   * Get a specific schedule by ID
   */
  getSchedule(id: string): Observable<Schedule> {
    // Ensure ID is string format
    const safeId = id.toString();
    const url = `${this.schedulesUrl}/${safeId}`;
    
    return this.http.get<Schedule>(url).pipe(
      tap(_ => console.log(`Fetched schedule id=${safeId}`)),
      switchMap(schedule => this.enhanceSchedules([schedule]).pipe(
        map(schedules => schedules[0])
      )),
      catchError(this.handleError<Schedule>(`getSchedule id=${safeId}`))
    );
  }
  
  /**
   * Create a new schedule
   */
  createSchedule(schedule: Partial<Schedule>): Observable<Schedule> {
    // Make sure store_id and created_by are strings
    const safeSchedule = { ...schedule };
    if (safeSchedule.store_id) safeSchedule.store_id = safeSchedule.store_id.toString();
    if (safeSchedule.created_by) safeSchedule.created_by = safeSchedule.created_by.toString();
    
    // Make sure shifts have string employee_ids
    if (safeSchedule.shifts) {
      safeSchedule.shifts = safeSchedule.shifts.map(shift => ({
        ...shift,
        employee_id: shift.employee_id.toString()
      }));
    }
    
    return this.http.post<Schedule>(this.schedulesUrl, safeSchedule).pipe(
      tap((newSchedule: Schedule) => console.log(`Created schedule id=${newSchedule._id}`)),
      catchError(this.handleError<Schedule>('createSchedule'))
    );
  }
  
  /**
   * Update an existing schedule
   */
  updateSchedule(id: string, schedule: Partial<Schedule>): Observable<Schedule> {
    const safeId = id.toString();
    const url = `${this.schedulesUrl}/${safeId}`;
    
    // Create a deep copy with careful shift processing
    const safeSchedule = { ...schedule };
    
    // Ensure shifts are properly processed
    if (safeSchedule.shifts) {
      safeSchedule.shifts = safeSchedule.shifts.map(shift => {
        // Ensure consistent shift object
        const processedShift: ScheduleShift = {
          employee_id: shift.employee_id.toString(),
          date: shift.date,
          start_time: shift.start_time,
          end_time: shift.end_time,
          _id: this.normalizeShiftId(shift._id),
          notes: shift.notes
        };
        
        // Conditionally add extra metadata
        if (shift.employee_name) {
          processedShift.employee_name = shift.employee_name;
        }
        
        return processedShift;
      });
    }
    
    // Remove non-standard properties
    const finalSchedule = this.sanitizeScheduleObject(safeSchedule);
    
    return this.http.put<Schedule>(url, finalSchedule).pipe(
      tap(response => {
        console.log(`Updated schedule id=${safeId}`);
        console.log('Server response:', JSON.stringify(response));
        
        // Warn about shift count discrepancy
        if (response.shifts?.length !== safeSchedule.shifts?.length) {
          console.warn(
            `Shift count mismatch. Sent: ${safeSchedule.shifts?.length}, Received: ${response.shifts?.length}`
          );
        }
      }),
      catchError(this.handleError<Schedule>(`updateSchedule id=${safeId}`))
    );
  }
  
  // Helper method to normalize shift IDs
  private normalizeShiftId(id?: string): string {
    // Remove temporary prefixes, generate new ID if needed
    if (!id || id.startsWith('temp_')) {
      return `shift_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    }
    return id;
  }
  
  // Sanitize schedule object
  private sanitizeScheduleObject(schedule: Partial<Schedule>): Partial<Schedule> {
    const sanitized = { ...schedule };
    const anySchedule = sanitized as any;
    
    // Remove known non-standard properties
    const propsToRemove = [
      'store_name', 
      'employee_names', 
      'created_at',
      'updated_at'
    ];
    
    propsToRemove.forEach(prop => {
      if (anySchedule[prop]) delete anySchedule[prop];
    });
    
    return sanitized;
  }

  /**
   * Delete a schedule
   */
  deleteSchedule(id: string): Observable<boolean> {
    // Ensure ID is string format
    const safeId = id.toString();
    const url = `${this.schedulesUrl}/${safeId}`;
    
    return this.http.delete<boolean>(url).pipe(
      tap(_ => console.log(`Deleted schedule id=${safeId}`)),
      catchError(this.handleError<boolean>(`deleteSchedule id=${safeId}`))
    );
  }
  
  /**
   * Add shift to schedule
   */
  addShift(scheduleId: string, shift: ScheduleShift): Observable<Schedule> {
    // Ensure schedule ID is string format
    const safeScheduleId = scheduleId.toString();
    const url = `${this.schedulesUrl}/${safeScheduleId}/shifts`;
    
    // Ensure employee_id is string
    const safeShift = { ...shift, employee_id: shift.employee_id.toString() };
    
    return this.http.post<Schedule>(url, safeShift).pipe(
      tap(_ => console.log(`Added shift to schedule id=${safeScheduleId}`)),
      catchError(this.handleError<Schedule>(`addShift scheduleId=${safeScheduleId}`))
    );
  }
  
  /**
   * Remove shift from schedule
   */
  removeShift(scheduleId: string, shiftId: string): Observable<Schedule> {
    // Ensure both IDs are string format
    const safeScheduleId = scheduleId.toString();
    const safeShiftId = shiftId.toString();
    
    const url = `${this.schedulesUrl}/${safeScheduleId}/shifts/${safeShiftId}`;
    
    return this.http.delete<Schedule>(url).pipe(
      tap(_ => console.log(`Removed shift id=${safeShiftId} from schedule id=${safeScheduleId}`)),
      catchError(this.handleError<Schedule>(`removeShift scheduleId=${safeScheduleId}, shiftId=${safeShiftId}`))
    );
  }

  /**
 * Get schedule for specific employee
 */
getEmployeeSchedule(employeeId: string, startDate: string, endDate: string): Observable<ScheduleShift[]> {
  // Special handling for admin users
  if (this.isAdminUser() && employeeId === this.authService.currentUser?._id) {
    console.log('Admin user trying to get personal schedule. Returning empty array.');
    return of([]);
  }
  
  // Ensure employee ID is string format
  const safeEmployeeId = employeeId.toString();
  
  const params = new HttpParams()
    .set('start_date', startDate)
    .set('end_date', endDate);
  
  const url = `${this.schedulesUrl}/employee/${safeEmployeeId}/shifts`;
  
  return this.http.get<ScheduleShift[]>(url, { params }).pipe(
    tap(shifts => console.log(`Fetched ${shifts.length} shifts for employee id=${safeEmployeeId}`)),
    catchError(this.handleError<ScheduleShift[]>(`getEmployeeSchedule employeeId=${safeEmployeeId}`, []))
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
        return employee._id.toString();
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
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

/**
 * Calculate time difference in minutes between two ISO datetime strings
 */
calculateTimeDifference(startTime: string, endTime: string): number {
  const start = new Date(startTime);
  const end = new Date(endTime);
  return Math.round((end.getTime() - start.getTime()) / (1000 * 60));
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
        const employee = employees.find(e => e._id === entry.employee_id);
        const store = stores.find(s => s._id === entry.store_id);
        
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
        const employee = employees.find(e => e._id === timesheet.employee_id);
        const store = stores.find(s => s._id === timesheet.store_id);
        
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
 * Enhance schedules with store names
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
        const store = stores.find(s => s._id === schedule.store_id);
        
        // Enhance each shift with employee name
        const enhancedShifts = schedule.shifts.map(shift => {
          const employee = employees.find(e => e._id === shift.employee_id);
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

/**
 * Handle Http operation that failed.
 * Let the app continue.
 * @param operation - name of the operation that failed
 * @param result - optional value to return as the observable result
 */
private handleError<T>(operation = 'operation', result?: T) {
  return (error: any): Observable<T> => {
    console.error(`${operation} failed: ${error.message}`);
    
    // Let the app keep running by returning an empty result.
    return of(result as T);
  };
}
}