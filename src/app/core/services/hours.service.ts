// src/app/core/services/hours.service.ts

import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { 
  Hours, 
  HoursCreate, 
  HoursUpdate, 
  HoursApproval, 
  TimeSheetSummary,
  ClockInRequest,
  ClockOutRequest,
  HoursStatus,
  HoursResponse
} from '../../shared/models/hours.model';
import { ApiService } from './api.service';
import { Store } from '../../shared/models/store.model';
import { Employee } from '../../shared/models/employee.model';

@Injectable({
  providedIn: 'root'
})
export class HoursService {
  private endpoint = '/hours';

  constructor(private apiService: ApiService) { }

  /**
   * Format date for API in ISO format
   * @param date Date to format
   * @returns Formatted date string
   */
  private formatDateForApi(date: Date | string): string {
    if (date instanceof Date) {
      return date.toISOString();
    }
    return date;
  }

  /**
   * Create a new hours record
   * @param hours Hours creation data
   * @returns Observable of created Hours
   */
  createHours(hours: HoursCreate): Observable<Hours> {
    // Format dates for API and ensure IDs are strings
    const formattedHours = { ...hours };
    
    // Format dates
    if (formattedHours.clock_in && formattedHours.clock_in instanceof Date) {
      formattedHours.clock_in = this.formatDateForApi(formattedHours.clock_in);
    }
    
    if (formattedHours.clock_out && formattedHours.clock_out instanceof Date) {
      formattedHours.clock_out = this.formatDateForApi(formattedHours.clock_out);
    }
    
    if (formattedHours.break_start && formattedHours.break_start instanceof Date) {
      formattedHours.break_start = this.formatDateForApi(formattedHours.break_start);
    }
    
    if (formattedHours.break_end && formattedHours.break_end instanceof Date) {
      formattedHours.break_end = this.formatDateForApi(formattedHours.break_end);
    }
    
    // Ensure IDs are strings
    if (formattedHours.employee_id) {
      formattedHours.employee_id = formattedHours.employee_id.toString();
    }
    
    if (formattedHours.store_id) {
      formattedHours.store_id = formattedHours.store_id.toString();
    }
    
    return this.apiService.post<HoursResponse>(this.endpoint, formattedHours).pipe(
      map(response => this.formatHoursResponse(response)),
      catchError(error => {
        console.error('Error creating hours record:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get a specific hours record
   * @param id Hours record ID
   * @returns Observable of Hours
   */
  getHours(id: string): Observable<Hours> {
    return this.apiService.get<HoursResponse>(`${this.endpoint}/${id}`).pipe(
      map(response => this.formatHoursResponse(response)),
      catchError(error => {
        console.error(`Error fetching hours with ID ${id}:`, error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Update an hours record
   * @param id Hours record ID
   * @param hours Hours update data
   * @returns Observable of updated Hours
   */
  updateHours(id: string, hours: HoursUpdate): Observable<Hours> {
    // Format dates for API and ensure IDs are strings
    const formattedHours = { ...hours };
    
    // Format dates
    if (formattedHours.clock_out && formattedHours.clock_out instanceof Date) {
      formattedHours.clock_out = this.formatDateForApi(formattedHours.clock_out);
    }
    
    if (formattedHours.break_start && formattedHours.break_start instanceof Date) {
      formattedHours.break_start = this.formatDateForApi(formattedHours.break_start);
    }
    
    if (formattedHours.break_end && formattedHours.break_end instanceof Date) {
      formattedHours.break_end = this.formatDateForApi(formattedHours.break_end);
    }
    
    return this.apiService.put<HoursResponse>(`${this.endpoint}/${id}`, formattedHours).pipe(
      map(response => this.formatHoursResponse(response)),
      catchError(error => {
        console.error(`Error updating hours with ID ${id}:`, error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Approve or reject an hours record
   * @param id Hours record ID
   * @param approval Approval data
   * @returns Observable of updated Hours
   */
  approveHours(id: string, approval: HoursApproval): Observable<Hours> {
    // Ensure ID is string
    const formattedId = id.toString();
    
    return this.apiService.post<HoursResponse>(`${this.endpoint}/${formattedId}/approve`, approval).pipe(
      map(response => this.formatHoursResponse(response)),
      catchError(error => {
        console.error(`Error approving hours with ID ${id}:`, error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Delete an hours record
   * @param id Hours record ID
   * @returns Observable of void
   */
  deleteHours(id: string): Observable<void> {
    // Ensure ID is string
    const formattedId = id.toString();
    
    return this.apiService.delete<void>(`${this.endpoint}/${formattedId}`).pipe(
      catchError(error => {
        console.error(`Error deleting hours with ID ${id}:`, error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get hours records for a specific employee
   * @param employeeId Employee ID
   * @param startDate Optional start date filter
   * @param endDate Optional end date filter
   * @param status Optional status filter
   * @returns Observable of Hours array
   */
  getEmployeeHours(
    employeeId: string, 
    startDate?: Date | string, 
    endDate?: Date | string, 
    status?: HoursStatus
  ): Observable<Hours[]> {
    // Ensure ID is string
    const formattedEmployeeId = employeeId.toString();
    
    const params = this.apiService.buildParams({
      start_date: startDate instanceof Date ? this.formatDateForApi(startDate) : startDate,
      end_date: endDate instanceof Date ? this.formatDateForApi(endDate) : endDate,
      status
    });
    
    return this.apiService.get<HoursResponse[]>(`${this.endpoint}/employee/${formattedEmployeeId}`, params).pipe(
      map(hours => hours.map(hour => this.formatHoursResponse(hour))),
      catchError(error => {
        console.error(`Error fetching hours for employee ${employeeId}:`, error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get hours records for a specific store
   * @param storeId Store ID
   * @param startDate Optional start date filter
   * @param endDate Optional end date filter
   * @param status Optional status filter
   * @returns Observable of Hours array
   */
  getStoreHours(
    storeId: string, 
    startDate?: Date | string, 
    endDate?: Date | string, 
    status?: HoursStatus
  ): Observable<Hours[]> {
    // Ensure ID is string
    const formattedStoreId = storeId.toString();
    
    const params = this.apiService.buildParams({
      start_date: startDate instanceof Date ? this.formatDateForApi(startDate) : startDate,
      end_date: endDate instanceof Date ? this.formatDateForApi(endDate) : endDate,
      status
    });
    
    return this.apiService.get<HoursResponse[]>(`${this.endpoint}/store/${formattedStoreId}`, params).pipe(
      map(hours => hours.map(hour => this.formatHoursResponse(hour))),
      catchError(error => {
        console.error(`Error fetching hours for store ${storeId}:`, error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get pending hours records for approval
   * @returns Observable of Hours array
   */
  getPendingApprovals(): Observable<Hours[]> {
    return this.apiService.get<HoursResponse[]>(`${this.endpoint}/approvals/pending`).pipe(
      map(hours => hours.map(hour => this.formatHoursResponse(hour))),
      catchError(error => {
        console.error('Error fetching pending approvals:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get weekly timesheet summary for an employee
   * @param employeeId Employee ID
   * @param weekStart Optional week start date
   * @returns Observable of TimeSheetSummary
   */
  getTimesheet(employeeId: string, weekStart?: Date | string): Observable<TimeSheetSummary> {
    // Ensure ID is string
    const formattedEmployeeId = employeeId.toString();
    
    const params = this.apiService.buildParams({
      week_start: weekStart instanceof Date ? this.formatDateForApi(weekStart) : weekStart
    });
    
    return this.apiService.get<TimeSheetSummary>(`${this.endpoint}/timesheet/${formattedEmployeeId}`, params).pipe(
      map(timesheet => ({
        ...timesheet,
        employee_id: timesheet.employee_id.toString(),
        week_start_date: typeof timesheet.week_start_date === 'string' ? 
          timesheet.week_start_date : 
          new Date(timesheet.week_start_date).toISOString(),
        week_end_date: typeof timesheet.week_end_date === 'string' ? 
          timesheet.week_end_date : 
          new Date(timesheet.week_end_date).toISOString()
      })),
      catchError(error => {
        console.error(`Error fetching timesheet for employee ${employeeId}:`, error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Clock in an employee
   * @param clockInData Clock-in request data
   * @returns Observable of Hours
   */
  clockIn(clockInData: ClockInRequest): Observable<Hours> {
    // Ensure ID is string
    const formattedData = { ...clockInData };
    
    if (formattedData.employee_id) {
      formattedData.employee_id = formattedData.employee_id.toString();
    }
    
    if (formattedData.store_id) {
      formattedData.store_id = formattedData.store_id.toString();
    }
    
    return this.apiService.post<HoursResponse>(`${this.endpoint}/clock-in`, formattedData).pipe(
      map(response => this.formatHoursResponse(response)),
      catchError(error => {
        console.error('Error clocking in employee:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Clock out an employee
   * @param employeeId Employee ID
   * @param clockOutData Clock-out request data
   * @returns Observable of Hours
   */
  clockOut(employeeId: string, clockOutData: ClockOutRequest): Observable<Hours> {
    // Ensure ID is string
    const formattedEmployeeId = employeeId.toString();
    
    // Format dates for API
    const formattedData = { ...clockOutData };
    
    if (formattedData.break_start && formattedData.break_start instanceof Date) {
      formattedData.break_start = this.formatDateForApi(formattedData.break_start);
    }
    
    if (formattedData.break_end && formattedData.break_end instanceof Date) {
      formattedData.break_end = this.formatDateForApi(formattedData.break_end);
    }
    
    return this.apiService.post<HoursResponse>(`${this.endpoint}/clock-out/${formattedEmployeeId}`, formattedData).pipe(
      map(response => this.formatHoursResponse(response)),
      catchError(error => {
        console.error(`Error clocking out employee ${employeeId}:`, error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get the active shift for an employee
   * @param employeeId Employee ID
   * @returns Observable of Hours
   */
  getActiveShift(employeeId: string): Observable<Hours> {
    // Ensure ID is string
    const formattedEmployeeId = employeeId.toString();
    
    return this.apiService.get<HoursResponse>(`${this.endpoint}/active-shift/${formattedEmployeeId}`).pipe(
      map(response => this.formatHoursResponse(response)),
      catchError(error => {
        console.error(`Error fetching active shift for employee ${employeeId}:`, error);
        return throwError(() => error);
      })
    );
  }

 /**
 * Format the hours response to ensure consistent structure
 * @param hours Hours response from API
 * @returns Formatted Hours object
 */
private formatHoursResponse(hours: HoursResponse): Hours {
  // Create a properly typed employee object if it exists
  let formattedEmployee: Employee | undefined = undefined;
  
  if (hours.employee) {
    formattedEmployee = {
      _id: hours.employee._id?.toString() || '',
      user_id: hours.employee.user_id?.toString() || '',
      email: hours.employee.email || '',
      full_name: hours.employee.full_name || '',
      position: hours.employee.position || '',
      employment_status: hours.employee.employment_status || 'active',
      hourly_rate: hours.employee.hourly_rate || 0,
      is_active: hours.employee.is_active ?? true,
      hire_date: typeof hours.employee.hire_date === 'string' ? 
        hours.employee.hire_date : new Date().toISOString(),
      store_id: hours.employee.store_id?.toString(),
      created_at: typeof hours.employee.created_at === 'string' ? 
        hours.employee.created_at : new Date().toISOString(),
      updated_at: typeof hours.employee.updated_at === 'string' ? 
        hours.employee.updated_at : new Date().toISOString()
    };
  }
  
  // Create a properly typed store object if it exists
  let formattedStore: Store | undefined = undefined;
  
  if (hours.store) {
    formattedStore = {
      _id: hours.store._id?.toString() || '',
      name: hours.store.name || '',
      address: hours.store.address || '',
      city: hours.store.city || '',
      state: hours.store.state || '',
      zip_code: hours.store.zip_code || '',
      phone: hours.store.phone || '',
      is_active: hours.store.is_active ?? true,
      created_at: typeof hours.store.created_at === 'string' ? 
        hours.store.created_at : new Date().toISOString(),
      updated_at: typeof hours.store.updated_at === 'string' ? 
        hours.store.updated_at : new Date().toISOString()
    };
  }
  
  return {
    ...hours,
    _id: hours._id ? hours._id.toString() : '',
    employee_id: hours.employee_id ? hours.employee_id.toString() : '',
    store_id: hours.store_id ? hours.store_id.toString() : '',
    approved_by: hours.approved_by ? hours.approved_by.toString() : undefined,
    // Use the properly formatted objects
    employee: formattedEmployee,
    store: formattedStore,
    // Set date field
    date: typeof hours.date === 'string' ? hours.date : new Date(hours.date).toISOString(),
    // Keep dates as strings for consistency
    clock_in: typeof hours.clock_in === 'string' ? hours.clock_in : new Date(hours.clock_in).toISOString(),
    clock_out: hours.clock_out ? 
      (typeof hours.clock_out === 'string' ? hours.clock_out : new Date(hours.clock_out).toISOString()) : 
      undefined,
    break_start: hours.break_start ?
      (typeof hours.break_start === 'string' ? hours.break_start : new Date(hours.break_start).toISOString()) :
      undefined,
    break_end: hours.break_end ?
      (typeof hours.break_end === 'string' ? hours.break_end : new Date(hours.break_end).toISOString()) :
      undefined,
    approved_at: hours.approved_at ?
      (typeof hours.approved_at === 'string' ? hours.approved_at : new Date(hours.approved_at).toISOString()) :
      undefined,
    created_at: typeof hours.created_at === 'string' ? 
      hours.created_at : 
      new Date(hours.created_at).toISOString(),
    updated_at: typeof hours.updated_at === 'string' ? 
      hours.updated_at : 
      new Date(hours.updated_at).toISOString()
  };
}
}