// src/app/core/services/hours.service.ts

import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { 
  Hours, 
  HoursCreate, 
  HoursUpdate, 
  HoursApproval, 
  TimeSheetSummary,
  ClockInRequest,
  ClockOutRequest,
  HoursStatus,
  HoursResponse,
  formatDateForApi
} from '../../shared/models/hours.model';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class HoursService {
  private endpoint = '/hours';

  constructor(private apiService: ApiService) { }

  /**
   * Create a new hours record
   * @param hours Hours creation data
   * @returns Observable of created Hours
   */
  createHours(hours: HoursCreate): Observable<Hours> {
    // Format dates for API
    const formattedHours = { ...hours };
    
    if (formattedHours.clock_in && formattedHours.clock_in instanceof Date) {
      formattedHours.clock_in = formatDateForApi(formattedHours.clock_in);
    }
    
    if (formattedHours.clock_out && formattedHours.clock_out instanceof Date) {
      formattedHours.clock_out = formatDateForApi(formattedHours.clock_out);
    }
    
    if (formattedHours.break_start && formattedHours.break_start instanceof Date) {
      formattedHours.break_start = formatDateForApi(formattedHours.break_start);
    }
    
    if (formattedHours.break_end && formattedHours.break_end instanceof Date) {
      formattedHours.break_end = formatDateForApi(formattedHours.break_end);
    }
    
    return this.apiService.post<HoursResponse>(this.endpoint, formattedHours).pipe(
      map(response => this.formatHoursResponse(response))
    );
  }

  /**
   * Get a specific hours record
   * @param id Hours record ID
   * @returns Observable of Hours
   */
  getHours(id: string): Observable<Hours> {
    return this.apiService.get<HoursResponse>(`${this.endpoint}/${id}`).pipe(
      map(response => this.formatHoursResponse(response))
    );
  }

  /**
   * Update an hours record
   * @param id Hours record ID
   * @param hours Hours update data
   * @returns Observable of updated Hours
   */
  updateHours(id: string, hours: HoursUpdate): Observable<Hours> {
    // Format dates for API
    const formattedHours = { ...hours };
    
    if (formattedHours.clock_out && formattedHours.clock_out instanceof Date) {
      formattedHours.clock_out = formatDateForApi(formattedHours.clock_out);
    }
    
    if (formattedHours.break_start && formattedHours.break_start instanceof Date) {
      formattedHours.break_start = formatDateForApi(formattedHours.break_start);
    }
    
    if (formattedHours.break_end && formattedHours.break_end instanceof Date) {
      formattedHours.break_end = formatDateForApi(formattedHours.break_end);
    }
    
    return this.apiService.put<HoursResponse>(`${this.endpoint}/${id}`, formattedHours).pipe(
      map(response => this.formatHoursResponse(response))
    );
  }

  /**
   * Approve or reject an hours record
   * @param id Hours record ID
   * @param approval Approval data
   * @returns Observable of updated Hours
   */
  approveHours(id: string, approval: HoursApproval): Observable<Hours> {
    return this.apiService.post<HoursResponse>(`${this.endpoint}/${id}/approve`, approval).pipe(
      map(response => this.formatHoursResponse(response))
    );
  }

  /**
   * Delete an hours record
   * @param id Hours record ID
   * @returns Observable of void
   */
  deleteHours(id: string): Observable<void> {
    return this.apiService.delete<void>(`${this.endpoint}/${id}`);
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
    const params = this.apiService.buildParams({
      start_date: startDate instanceof Date ? formatDateForApi(startDate) : startDate,
      end_date: endDate instanceof Date ? formatDateForApi(endDate) : endDate,
      status
    });
    
    return this.apiService.get<HoursResponse[]>(`${this.endpoint}/employee/${employeeId}`, params).pipe(
      map(hours => hours.map(hour => this.formatHoursResponse(hour)))
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
    const params = this.apiService.buildParams({
      start_date: startDate instanceof Date ? formatDateForApi(startDate) : startDate,
      end_date: endDate instanceof Date ? formatDateForApi(endDate) : endDate,
      status
    });
    
    return this.apiService.get<HoursResponse[]>(`${this.endpoint}/store/${storeId}`, params).pipe(
      map(hours => hours.map(hour => this.formatHoursResponse(hour)))
    );
  }

  /**
   * Get pending hours records for approval
   * @returns Observable of Hours array
   */
  getPendingApprovals(): Observable<Hours[]> {
    return this.apiService.get<HoursResponse[]>(`${this.endpoint}/approvals/pending`).pipe(
      map(hours => hours.map(hour => this.formatHoursResponse(hour)))
    );
  }

  /**
   * Get weekly timesheet summary for an employee
   * @param employeeId Employee ID
   * @param weekStart Optional week start date
   * @returns Observable of TimeSheetSummary
   */
  getTimesheet(employeeId: string, weekStart?: Date | string): Observable<TimeSheetSummary> {
    const params = this.apiService.buildParams({
      week_start: weekStart instanceof Date ? formatDateForApi(weekStart) : weekStart
    });
    
    return this.apiService.get<TimeSheetSummary>(`${this.endpoint}/timesheet/${employeeId}`, params).pipe(
      map(timesheet => ({
        ...timesheet,
        employee_id: timesheet.employee_id.toString(),
        week_start_date: typeof timesheet.week_start_date === 'string' ? 
          timesheet.week_start_date : 
          new Date(timesheet.week_start_date).toISOString(),
        week_end_date: typeof timesheet.week_end_date === 'string' ? 
          timesheet.week_end_date : 
          new Date(timesheet.week_end_date).toISOString()
      }))
    );
  }

  /**
   * Clock in an employee
   * @param clockInData Clock-in request data
   * @returns Observable of Hours
   */
  clockIn(clockInData: ClockInRequest): Observable<Hours> {
    return this.apiService.post<HoursResponse>(`${this.endpoint}/clock-in`, clockInData).pipe(
      map(response => this.formatHoursResponse(response))
    );
  }

  /**
   * Clock out an employee
   * @param employeeId Employee ID
   * @param clockOutData Clock-out request data
   * @returns Observable of Hours
   */
  clockOut(employeeId: string, clockOutData: ClockOutRequest): Observable<Hours> {
    // Format dates for API
    const formattedData = { ...clockOutData };
    
    if (formattedData.break_start && formattedData.break_start instanceof Date) {
      formattedData.break_start = formatDateForApi(formattedData.break_start);
    }
    
    if (formattedData.break_end && formattedData.break_end instanceof Date) {
      formattedData.break_end = formatDateForApi(formattedData.break_end);
    }
    
    return this.apiService.post<HoursResponse>(`${this.endpoint}/clock-out/${employeeId}`, formattedData).pipe(
      map(response => this.formatHoursResponse(response))
    );
  }

  /**
   * Get the active shift for an employee
   * @param employeeId Employee ID
   * @returns Observable of Hours
   */
  getActiveShift(employeeId: string): Observable<Hours> {
    return this.apiService.get<HoursResponse>(`${this.endpoint}/active-shift/${employeeId}`).pipe(
      map(response => this.formatHoursResponse(response))
    );
  }

  /**
   * Format the hours response to ensure consistent structure
   * @param hours Hours response from API
   * @returns Formatted Hours object
   */
  private formatHoursResponse(hours: HoursResponse): Hours {
    return {
      ...hours,
      _id: hours._id.toString(),
      employee_id: hours.employee_id.toString(),
      store_id: hours.store_id.toString(),
      approved_by: hours.approved_by ? hours.approved_by.toString() : undefined,
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