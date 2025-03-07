// src/app/core/services/employee.service.ts

import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { 
  Employee, 
  EmployeeCreate, 
  EmployeeUpdate, 
  EmployeeResponse, 
  EmployeeListResponse 
} from '../../shared/models/employee.model';
import { ApiService } from './api.service';
import { Store } from '../../shared/models/store.model';

@Injectable({
  providedIn: 'root'
})
export class EmployeeService {
  private endpoint = '/employees';

  constructor(private apiService: ApiService) { }

  /**
   * Get a filtered and paginated list of employees
   * @param skip Number of items to skip
   * @param limit Maximum number of items to return
   * @param store_id Optional store ID filter
   * @param search Optional search term
   * @param status Optional status filter
   * @returns Observable of Employee array and total count
   */
  getEmployees(
    skip: number = 0, 
    limit: number = 10, 
    store_id?: string, 
    search?: string,
    status?: string
  ): Observable<Employee[]> {
    const params = this.apiService.buildParams({
      skip,
      limit,
      store_id: store_id ? store_id.toString() : undefined,
      search,
      status
    });
    
    return this.apiService.get<EmployeeResponse[]>(this.endpoint, params).pipe(
      map(employees => employees.map(employee => this.formatEmployeeResponse(employee))),
      catchError(error => {
        console.error('Error fetching employees:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get a specific employee by ID
   * @param id Employee ID
   * @returns Observable of Employee
   */
  getEmployeeById(id: string): Observable<Employee> {
    return this.apiService.get<EmployeeResponse>(`${this.endpoint}/${id}`).pipe(
      map(response => this.formatEmployeeResponse(response)),
      catchError(error => {
        console.error(`Error fetching employee with ID ${id}:`, error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get employees for a specific store
   * @param storeId Store ID
   * @returns Observable of Employee array
   */
  getEmployeesByStore(storeId: string): Observable<Employee[]> {
    // Ensure storeId is a string
    const formattedStoreId = storeId.toString();
    
    return this.apiService.get<EmployeeResponse[]>(`${this.endpoint}/store/${formattedStoreId}`).pipe(
      map(employees => employees.map(employee => this.formatEmployeeResponse(employee))),
      catchError(error => {
        console.error(`Error fetching employees for store ${storeId}:`, error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Create a new employee
   * @param employee Employee creation data
   * @returns Observable of created Employee
   */
  createEmployee(employee: EmployeeCreate): Observable<Employee> {
    // Ensure IDs are strings
    const formattedEmployee = { ...employee };
    
    // Handle specific fields - ensure they are strings
    if (formattedEmployee.store_id) {
      formattedEmployee.store_id = formattedEmployee.store_id.toString();
    }
    if (formattedEmployee.role_id) {
      formattedEmployee.role_id = formattedEmployee.role_id.toString();
    }
    
    return this.apiService.post<EmployeeResponse>(this.endpoint, formattedEmployee).pipe(
      map(response => this.formatEmployeeResponse(response)),
      catchError(error => {
        console.error('Error creating employee:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Update an existing employee
   * @param id Employee ID
   * @param employee Employee update data
   * @returns Observable of updated Employee
   */
  updateEmployee(id: string, employee: EmployeeUpdate): Observable<Employee> {
    // Ensure IDs are strings
    const formattedEmployee = { ...employee };
    
    // Handle specific fields - ensure they are strings
    if (formattedEmployee.store_id) {
      formattedEmployee.store_id = formattedEmployee.store_id.toString();
    }
    if (formattedEmployee.role_id) {
      formattedEmployee.role_id = formattedEmployee.role_id.toString();
    }
    
    return this.apiService.put<EmployeeResponse>(`${this.endpoint}/${id}`, formattedEmployee).pipe(
      map(response => this.formatEmployeeResponse(response)),
      catchError(error => {
        console.error(`Error updating employee with ID ${id}:`, error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Delete an employee
   * @param id Employee ID
   * @returns Observable of void
   */
  deleteEmployee(id: string): Observable<any> {
    return this.apiService.delete(`${this.endpoint}/${id}`).pipe(
      catchError(error => {
        console.error(`Error deleting employee with ID ${id}:`, error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Assign an employee to a store
   * @param employeeId Employee ID
   * @param storeId Store ID
   * @returns Observable of updated Employee
   */
  assignEmployeeToStore(employeeId: string, storeId: string): Observable<Employee> {
    // Ensure IDs are strings
    const formattedEmployeeId = employeeId.toString();
    const formattedStoreId = storeId.toString();
    
    return this.apiService.put<EmployeeResponse>(
      `${this.endpoint}/${formattedEmployeeId}/assign-store/${formattedStoreId}`, 
      {}
    ).pipe(
      map(response => this.formatEmployeeResponse(response)),
      catchError(error => {
        console.error(`Error assigning employee ${employeeId} to store ${storeId}:`, error);
        return throwError(() => error);
      })
    );
  }

  /**
 * Format the employee response to ensure consistent structure
 * @param employee Employee response from API
 * @returns Formatted Employee object
 */
private formatEmployeeResponse(employee: EmployeeResponse): Employee {
  // Create a properly typed store object if it exists
  let formattedStore: Store | undefined = undefined;
  
  if (employee.store) {
    formattedStore = {
      _id: employee.store._id?.toString() || '',
      name: employee.store.name || '',
      address: employee.store['address'] || '',
      city: employee.store['city'] || '',
      state: employee.store['state'] || '',
      zip_code: employee.store['zip_code'] || '',
      phone: employee.store['phone'] || '',
      is_active: employee.store['is_active'] ?? true,
      created_at: typeof employee.store['created_at'] === 'string' ? 
        employee.store['created_at'] : new Date().toISOString(),
      updated_at: typeof employee.store['updated_at'] === 'string' ? 
        employee.store['updated_at'] : new Date().toISOString()
    };
  }
  
  return {
    ...employee,
    _id: employee._id?.toString() || '',
    user_id: employee.user_id?.toString() || '',
    role_id: employee.role_id?.toString() || '',
    store_id: employee.store_id ? employee.store_id.toString() : undefined,
    // Use the properly formatted store
    store: formattedStore,
    // For required date fields, provide a default empty string or current date
    created_at: employee.created_at ? 
      (typeof employee.created_at === 'string' ? 
        employee.created_at : 
        new Date(employee.created_at).toISOString())
      : new Date().toISOString(),  // Default to current date if missing
    updated_at: employee.updated_at ?
      (typeof employee.updated_at === 'string' ? 
        employee.updated_at : 
        new Date(employee.updated_at).toISOString())
      : new Date().toISOString(),  // Default to current date if missing
    hire_date: employee.hire_date ?
      (typeof employee.hire_date === 'string' ? 
        employee.hire_date : 
        new Date(employee.hire_date).toISOString())
      : new Date().toISOString()  // Default to current date if missing
  };
}
}