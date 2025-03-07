// src/app/core/services/hours.service.ts

import { Injectable } from '@angular/core';
import { forkJoin, Observable, of, throwError } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
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
import { EmployeeService } from './employee.service';
import { StoreService } from './store.service';

@Injectable({
  providedIn: 'root'
})
export class HoursService {
  private endpoint = '/hours';

  constructor(
    private apiService: ApiService,
    private employeeService : EmployeeService,
    private storeService : StoreService
  ) { }

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

  getAllHours(
    skip: number = 0,
    limit: number = 100,
    employee_id?: string,
    store_id?: string,
    status?: string,
    start_date?: string,
    end_date?: string
  ): Observable<Hours[]> {
    // Build query parameters
    const params = this.apiService.buildParams({
      skip,
      limit,
      employee_id,
      store_id,
      status,
      start_date,
      end_date
    });
    
    console.log('Getting hours with params:', params);
    
    return this.apiService.get<HoursResponse[]>(`${this.endpoint}`, params).pipe(
      switchMap(hoursList => {
        // If we have hours, let's fetch the related data
        if (hoursList && hoursList.length > 0) {
          // Extract unique employee IDs and store IDs
          const employeeIds = [...new Set(hoursList.map(h => h.employee_id).filter(id => id))];
          const storeIds = [...new Set(hoursList.map(h => h.store_id).filter(id => id))];
          
          // Create observables for each required API call
          const requests: Observable<any>[] = [];
          
          // Only add these requests if we have IDs to fetch
          if (employeeIds.length > 0) {
            const employeeRequests = employeeIds.map(id => 
              this.employeeService.getEmployeeById(id.toString()).pipe(
                catchError(err => {
                  console.error(`Error fetching employee ${id}:`, err);
                  return of(null);
                })
              )
            );
            requests.push(...employeeRequests);
          }
          
          if (storeIds.length > 0) {
            const storeRequests = storeIds.map(id => 
              this.storeService.getStore(id.toString()).pipe(
                catchError(err => {
                  console.error(`Error fetching store ${id}:`, err);
                  return of(null);
                })
              )
            );
            requests.push(...storeRequests);
          }
          
          // If we have any requests to make
          if (requests.length > 0) {
            return forkJoin(requests).pipe(
              map(results => {
                // Process results and update hour records
                const employees: { [id: string]: Employee } = {};
                const stores: { [id: string]: Store } = {};
                
                // Group results by type
                results.forEach(result => {
                  if (result) {
                    if (employeeIds.includes(result._id)) {
                      employees[result._id] = result;
                    } else if (storeIds.includes(result._id)) {
                      stores[result._id] = result;
                    }
                  }
                });
                
                // Enhance each hour with employee and store data
                return hoursList.map(hour => {
                  const formattedHour = this.formatHoursResponse(hour);
                  
                  // Add employee data if available
                  if (hour.employee_id && employees[hour.employee_id]) {
                    formattedHour.employee = employees[hour.employee_id];
                  }
                  
                  // Add store data if available
                  if (hour.store_id && stores[hour.store_id]) {
                    formattedHour.store = stores[hour.store_id];
                  }
                  
                  return formattedHour;
                });
              })
            );
          }
        }
        
        // Just format hours if no additional data needed
        return of(hoursList.map(hour => this.formatHoursResponse(hour)));
      }),
      catchError(error => {
        console.error('Error getting hours:', error);
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
    // Use the main endpoint with a status filter instead of a special endpoint
    return this.getAllHours(
      0,     // skip
      100,   // limit
      undefined, // employee_id
      undefined, // store_id
      'pending'  // status
    ).pipe(
      catchError(error => {
        console.error('Error fetching pending approvals:', error);
        // Return empty array on error to avoid breaking the UI
        return of([]);
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
// In HoursService class

private formatHoursResponse(hours: HoursResponse): Hours {
  try {
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
        hire_date: this.safeFormatDate(hours.employee.hire_date),
        store_id: hours.employee.store_id?.toString(),
        created_at: this.safeFormatDate(hours.employee.created_at),
        updated_at: this.safeFormatDate(hours.employee.updated_at)
      };
    } else if (hours.employee_id) {
      // If we only have an employee ID, we'll create a minimal employee object
      // This should be populated later in the component with the real data
      formattedEmployee = {
        _id: hours.employee_id.toString(),
        user_id: '',
        email: '',
        full_name: 'Employee #' + hours.employee_id.toString(),
        position: '',
        employment_status: 'active',
        hourly_rate: 0,
        is_active: true,
        hire_date: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    }
    
    // Similar handling for store
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
        created_at: this.safeFormatDate(hours.store.created_at),
        updated_at: this.safeFormatDate(hours.store.updated_at)
      };
    } else if (hours.store_id) {
      // If we only have a store ID, we'll create a minimal store object
      formattedStore = {
        _id: hours.store_id.toString(),
        name: 'Store #' + hours.store_id.toString(),
        address: '',
        city: '',
        state: '',
        zip_code: '',
        phone: '',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
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
      date: hours.date ? this.safeFormatDate(hours.date) : new Date().toISOString(),
      // Keep dates as strings for consistency
      clock_in: this.safeFormatDate(hours.clock_in),
      clock_out: hours.clock_out ? this.safeFormatDate(hours.clock_out) : undefined,
      break_start: hours.break_start ? this.safeFormatDate(hours.break_start) : undefined,
      break_end: hours.break_end ? this.safeFormatDate(hours.break_end) : undefined,
      approved_at: hours.approved_at ? this.safeFormatDate(hours.approved_at) : undefined,
      created_at: this.safeFormatDate(hours.created_at),
      updated_at: this.safeFormatDate(hours.updated_at)
    };
  } catch (error) {
    console.error('Error formatting hours response:', error, hours);
    // Return a minimal valid Hours object to avoid crashing
    return {
      _id: hours._id ? hours._id.toString() : 'error-id',
      employee_id: hours.employee_id ? hours.employee_id.toString() : '',
      store_id: hours.store_id ? hours.store_id.toString() : '',
      date: new Date().toISOString(),
      clock_in: new Date().toISOString(),
      status: HoursStatus.PENDING,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }
}

// Add this helper method to safely format dates
private safeFormatDate(date: any): string {
  if (!date) return new Date().toISOString();
  
  try {
    // Handle string dates
    if (typeof date === 'string') {
      return new Date(date).toISOString();
    }
    
    // Handle Date objects
    if (date instanceof Date) {
      return date.toISOString();
    }
    
    // Handle MongoDB date format with $date field
    if (typeof date === 'object' && date.$date) {
      return new Date(date.$date).toISOString();
    }
    
    // Fall back to current date if we can't parse
    return new Date().toISOString();
  } catch (error) {
    console.warn('Error formatting date:', date, error);
    return new Date().toISOString();
  }
}
}