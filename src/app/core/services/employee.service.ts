// src/app/core/services/employee.service.ts

import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Employee, EmployeeCreate, EmployeeUpdate, EmployeeResponse } from '../../shared/models/employee.model';
import { ApiService } from './api.service';

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
   * @returns Observable of Employee array
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
      store_id,
      search,
      status
    });
    
    return this.apiService.get<EmployeeResponse[]>(this.endpoint, params).pipe(
      map(employees => employees.map(employee => this.formatEmployeeResponse(employee)))
    );
  }

  /**
   * Get a specific employee by ID
   * @param id Employee ID
   * @returns Observable of Employee
   */
  getEmployeeById(id: string): Observable<Employee> {
    return this.apiService.get<EmployeeResponse>(`${this.endpoint}/${id}`).pipe(
      map(response => this.formatEmployeeResponse(response))
    );
  }

  /**
   * Get employees for a specific store
   * @param storeId Store ID
   * @returns Observable of Employee array
   */
  getEmployeesByStore(storeId: string): Observable<Employee[]> {
    return this.apiService.get<EmployeeResponse[]>(`${this.endpoint}/store/${storeId}`).pipe(
      map(employees => employees.map(employee => this.formatEmployeeResponse(employee)))
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
    if (formattedEmployee.store_id) {
      formattedEmployee.store_id = formattedEmployee.store_id.toString();
    }
    if (formattedEmployee.role_id) {
      formattedEmployee.role_id = formattedEmployee.role_id.toString();
    }
    
    return this.apiService.post<EmployeeResponse>(this.endpoint, formattedEmployee).pipe(
      map(response => this.formatEmployeeResponse(response))
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
    if (formattedEmployee.store_id) {
      formattedEmployee.store_id = formattedEmployee.store_id.toString();
    }
    if (formattedEmployee.role_id) {
      formattedEmployee.role_id = formattedEmployee.role_id.toString();
    }
    
    return this.apiService.put<EmployeeResponse>(`${this.endpoint}/${id}`, formattedEmployee).pipe(
      map(response => this.formatEmployeeResponse(response))
    );
  }

  /**
   * Delete an employee
   * @param id Employee ID
   * @returns Observable of void
   */
  deleteEmployee(id: string): Observable<any> {
    return this.apiService.delete(`${this.endpoint}/${id}`);
  }

  /**
   * Assign an employee to a store
   * @param employeeId Employee ID
   * @param storeId Store ID
   * @returns Observable of updated Employee
   */
  assignEmployeeToStore(employeeId: string, storeId: string): Observable<Employee> {
    return this.apiService.put<EmployeeResponse>(
      `${this.endpoint}/${employeeId}/assign-store/${storeId}`, 
      {}
    ).pipe(
      map(response => this.formatEmployeeResponse(response))
    );
  }

  /**
   * Format the employee response to ensure consistent structure
   * @param employee Employee response from API
   * @returns Formatted Employee object
   */
  private formatEmployeeResponse(employee: EmployeeResponse): Employee {
    return {
      ...employee,
      _id: employee._id?.toString() || '',
      user_id: employee.user_id?.toString() || '',
      role_id: employee.role_id?.toString() || '',
      store_id: employee.store_id ? employee.store_id.toString() : undefined,
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