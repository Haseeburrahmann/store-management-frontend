// src/app/core/services/hours.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, forkJoin } from 'rxjs';
import { catchError, tap, map, switchMap } from 'rxjs/operators';
import { TimeEntry, WeeklyTimesheet, Schedule, ScheduleShift } from '../../shared/models/hours.model';
import { EmployeeService } from './employee.service';
import { StoreService } from './store.service';
import { AuthService } from '../auth/auth.service';

@Injectable({
  providedIn: 'root'
})
export class HoursService {
  private timeEntriesUrl = '/api/v1/time-entries';
  private timesheetsUrl = '/api/v1/timesheets';
  private schedulesUrl = '/api/v1/schedules';
  
  constructor(
    private http: HttpClient,
    private employeeService: EmployeeService,
    private storeService: StoreService,
    private authService: AuthService
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
    const url = `${this.timeEntriesUrl}/${id}`;
    return this.http.get<TimeEntry>(url).pipe(
      tap(_ => console.log(`Fetched time entry id=${id}`)),
      switchMap(entry => this.enhanceTimeEntries([entry]).pipe(
        map(entries => entries[0])
      )),
      catchError(this.handleError<TimeEntry>(`getTimeEntry id=${id}`))
    );
  }
  
  /**
   * Create a new time entry
   */
  createTimeEntry(entry: Partial<TimeEntry>): Observable<TimeEntry> {
    return this.http.post<TimeEntry>(this.timeEntriesUrl, entry).pipe(
      tap((newEntry: TimeEntry) => console.log(`Created time entry id=${newEntry._id}`)),
      catchError(this.handleError<TimeEntry>('createTimeEntry'))
    );
  }
  
  /**
   * Update an existing time entry
   */
  updateTimeEntry(id: string, entry: Partial<TimeEntry>): Observable<TimeEntry> {
    const url = `${this.timeEntriesUrl}/${id}`;
    return this.http.put<TimeEntry>(url, entry).pipe(
      tap(_ => console.log(`Updated time entry id=${id}`)),
      catchError(this.handleError<TimeEntry>(`updateTimeEntry id=${id}`))
    );
  }
  
  /**
   * Delete a time entry
   */
  deleteTimeEntry(id: string): Observable<boolean> {
    const url = `${this.timeEntriesUrl}/${id}`;
    return this.http.delete<boolean>(url).pipe(
      tap(_ => console.log(`Deleted time entry id=${id}`)),
      catchError(this.handleError<boolean>(`deleteTimeEntry id=${id}`))
    );
  }
  
  /**
   * Clock in for the current user
   */
  clockIn(storeId: string, notes?: string): Observable<TimeEntry> {
    const entry: Partial<TimeEntry> = {
      employee_id: this.getCurrentEmployeeId(),
      store_id: storeId,
      clock_in: new Date().toISOString(),
      status: 'pending',
      notes: notes
    };
    
    return this.createTimeEntry(entry);
  }
  
  /**
   * Clock out for a specific time entry
   */
  clockOut(entryId: string, notes?: string): Observable<TimeEntry> {
    const updatedData: Partial<TimeEntry> = {
      clock_out: new Date().toISOString(),
      notes: notes
    };
    
    return this.updateTimeEntry(entryId, updatedData);
  }
  
  /**
   * Get active time entry (clocked in but not out) for an employee
   */
  getActiveTimeEntry(employeeId: string): Observable<TimeEntry | null> {
    const params = new HttpParams()
      .set('employee_id', employeeId)
      .set('active', 'true');
    
    return this.http.get<TimeEntry[]>(this.timeEntriesUrl, { params }).pipe(
      map(entries => entries.length > 0 ? entries[0] : null),
      catchError(this.handleError<TimeEntry | null>('getActiveTimeEntry', null))
    );
  }
  
  /**
   * Approve a time entry
   */
  approveTimeEntry(id: string): Observable<TimeEntry> {
    const url = `${this.timeEntriesUrl}/${id}/approve`;
    return this.http.post<TimeEntry>(url, {}).pipe(
      tap(_ => console.log(`Approved time entry id=${id}`)),
      catchError(this.handleError<TimeEntry>(`approveTimeEntry id=${id}`))
    );
  }
  
  /**
   * Reject a time entry with reason
   */
  rejectTimeEntry(id: string, reason: string): Observable<TimeEntry> {
    const url = `${this.timeEntriesUrl}/${id}/reject`;
    return this.http.post<TimeEntry>(url, { reason }).pipe(
      tap(_ => console.log(`Rejected time entry id=${id}`)),
      catchError(this.handleError<TimeEntry>(`rejectTimeEntry id=${id}`))
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
    let params = new HttpParams();
    
    if (options.employee_id) params = params.set('employee_id', options.employee_id);
    if (options.store_id) params = params.set('store_id', options.store_id);
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
    const url = `${this.timesheetsUrl}/${id}`;
    return this.http.get<WeeklyTimesheet>(url).pipe(
      tap(_ => console.log(`Fetched timesheet id=${id}`)),
      switchMap(timesheet => this.enhanceTimesheets([timesheet]).pipe(
        map(timesheets => timesheets[0])
      )),
      catchError(this.handleError<WeeklyTimesheet>(`getTimesheet id=${id}`))
    );
  }
  
  /**
   * Create a new timesheet
   */
  createTimesheet(timesheet: Partial<WeeklyTimesheet>): Observable<WeeklyTimesheet> {
    return this.http.post<WeeklyTimesheet>(this.timesheetsUrl, timesheet).pipe(
      tap((newTimesheet: WeeklyTimesheet) => console.log(`Created timesheet id=${newTimesheet._id}`)),
      catchError(this.handleError<WeeklyTimesheet>('createTimesheet'))
    );
  }
  
  /**
   * Update an existing timesheet
   */
  updateTimesheet(id: string, timesheet: Partial<WeeklyTimesheet>): Observable<WeeklyTimesheet> {
    const url = `${this.timesheetsUrl}/${id}`;
    return this.http.put<WeeklyTimesheet>(url, timesheet).pipe(
      tap(_ => console.log(`Updated timesheet id=${id}`)),
      catchError(this.handleError<WeeklyTimesheet>(`updateTimesheet id=${id}`))
    );
  }
  
  /**
   * Delete a timesheet
   */
  deleteTimesheet(id: string): Observable<boolean> {
    const url = `${this.timesheetsUrl}/${id}`;
    return this.http.delete<boolean>(url).pipe(
      tap(_ => console.log(`Deleted timesheet id=${id}`)),
      catchError(this.handleError<boolean>(`deleteTimesheet id=${id}`))
    );
  }
  
  /**
   * Submit a timesheet for approval
   */
  submitTimesheet(id: string): Observable<WeeklyTimesheet> {
    const url = `${this.timesheetsUrl}/${id}/submit`;
    return this.http.post<WeeklyTimesheet>(url, {}).pipe(
      tap(_ => console.log(`Submitted timesheet id=${id}`)),
      catchError(this.handleError<WeeklyTimesheet>(`submitTimesheet id=${id}`))
    );
  }
  
  /**
   * Approve a timesheet
   */
  approveTimesheet(id: string): Observable<WeeklyTimesheet> {
    const url = `${this.timesheetsUrl}/${id}/approve`;
    return this.http.post<WeeklyTimesheet>(url, {}).pipe(
      tap(_ => console.log(`Approved timesheet id=${id}`)),
      catchError(this.handleError<WeeklyTimesheet>(`approveTimesheet id=${id}`))
    );
  }
  
  /**
   * Reject a timesheet with reason
   */
  rejectTimesheet(id: string, reason: string): Observable<WeeklyTimesheet> {
    const url = `${this.timesheetsUrl}/${id}/reject`;
    return this.http.post<WeeklyTimesheet>(url, { reason }).pipe(
      tap(_ => console.log(`Rejected timesheet id=${id}`)),
      catchError(this.handleError<WeeklyTimesheet>(`rejectTimesheet id=${id}`))
    );
  }
  
  /**
   * Get the current timesheet for an employee
   */
  getCurrentTimesheet(employeeId: string): Observable<WeeklyTimesheet | null> {
    const today = new Date();
    const startOfWeek = this.getStartOfWeek(today);
    const endOfWeek = this.getEndOfWeek(today);
    
    const params = new HttpParams()
      .set('employee_id', employeeId)
      .set('start_date', startOfWeek.toISOString().split('T')[0])
      .set('end_date', endOfWeek.toISOString().split('T')[0]);
    
    return this.http.get<WeeklyTimesheet[]>(this.timesheetsUrl, { params }).pipe(
      map(timesheets => timesheets.length > 0 ? timesheets[0] : null),
      catchError(this.handleError<WeeklyTimesheet | null>('getCurrentTimesheet', null))
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
    
    if (options.store_id) params = params.set('store_id', options.store_id);
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
    const url = `${this.schedulesUrl}/${id}`;
    return this.http.get<Schedule>(url).pipe(
      tap(_ => console.log(`Fetched schedule id=${id}`)),
      switchMap(schedule => this.enhanceSchedules([schedule]).pipe(
        map(schedules => schedules[0])
      )),
      catchError(this.handleError<Schedule>(`getSchedule id=${id}`))
    );
  }
  
  /**
   * Create a new schedule
   */
  createSchedule(schedule: Partial<Schedule>): Observable<Schedule> {
    return this.http.post<Schedule>(this.schedulesUrl, schedule).pipe(
      tap((newSchedule: Schedule) => console.log(`Created schedule id=${newSchedule._id}`)),
      catchError(this.handleError<Schedule>('createSchedule'))
    );
  }
  
  /**
   * Update an existing schedule
   */
  updateSchedule(id: string, schedule: Partial<Schedule>): Observable<Schedule> {
    const url = `${this.schedulesUrl}/${id}`;
    return this.http.put<Schedule>(url, schedule).pipe(
      tap(_ => console.log(`Updated schedule id=${id}`)),
      catchError(this.handleError<Schedule>(`updateSchedule id=${id}`))
    );
  }
  
  /**
   * Delete a schedule
   */
  deleteSchedule(id: string): Observable<boolean> {
    const url = `${this.schedulesUrl}/${id}`;
    return this.http.delete<boolean>(url).pipe(
      tap(_ => console.log(`Deleted schedule id=${id}`)),
      catchError(this.handleError<boolean>(`deleteSchedule id=${id}`))
    );
  }
  
  /**
   * Add shift to schedule
   */
  addShift(scheduleId: string, shift: ScheduleShift): Observable<Schedule> {
    const url = `${this.schedulesUrl}/${scheduleId}/shifts`;
    return this.http.post<Schedule>(url, shift).pipe(
      tap(_ => console.log(`Added shift to schedule id=${scheduleId}`)),
      catchError(this.handleError<Schedule>(`addShift scheduleId=${scheduleId}`))
    );
  }
  
  /**
   * Remove shift from schedule
   */
  removeShift(scheduleId: string, shiftId: string): Observable<Schedule> {
    const url = `${this.schedulesUrl}/${scheduleId}/shifts/${shiftId}`;
    return this.http.delete<Schedule>(url).pipe(
      tap(_ => console.log(`Removed shift id=${shiftId} from schedule id=${scheduleId}`)),
      catchError(this.handleError<Schedule>(`removeShift scheduleId=${scheduleId}, shiftId=${shiftId}`))
    );
  }
  
  /**
   * Get schedule for specific employee
   */
  getEmployeeSchedule(employeeId: string, startDate: string, endDate: string): Observable<ScheduleShift[]> {
    const params = new HttpParams()
      .set('employee_id', employeeId)
      .set('start_date', startDate)
      .set('end_date', endDate);
    
    const url = `${this.schedulesUrl}/employee`;
    return this.http.get<ScheduleShift[]>(url, { params }).pipe(
      tap(shifts => console.log(`Fetched ${shifts.length} shifts for employee id=${employeeId}`)),
      catchError(this.handleError<ScheduleShift[]>(`getEmployeeSchedule employeeId=${employeeId}`, []))
    );
  }
  
  // ======== Helper Methods ========
  
  /**
   * Get current employee ID from the authenticated user
   */
  private getCurrentEmployeeId(): string {
    // This assumes there's a way to get the employee ID from the current user
    // In a real application, you would need to establish this relationship
    const currentUser = this.authService.currentUser;
    if (!currentUser) {
      throw new Error('No authenticated user found');
    }
    
    // For now, assuming user._id is also the employee_id
    // In a real app, you would likely need to query the employees endpoint
    return currentUser._id;
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
   * Enhance schedules with store names and employee names in shifts
   */
  private enhanceSchedules(schedules: Schedule[]): Observable<Schedule[]> {
    if (schedules.length === 0) {
      return of([]);
    }
    
    const storeIds = [...new Set(schedules.map(schedule => schedule.store_id))];
    
    // Collect all unique employee IDs from all shifts
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