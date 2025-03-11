// src/app/core/services/employee.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, forkJoin } from 'rxjs';
import { catchError, tap, map, switchMap } from 'rxjs/operators';
import { Employee } from '../../shared/models/employee.model';
import { StoreService } from './store.service';
import { UserService } from './user.service';

@Injectable({
  providedIn: 'root'
})
export class EmployeeService {
  private apiUrl = '/api/v1/employees';
  
  constructor(
    private http: HttpClient,
    private storeService: StoreService,
    private userService: UserService
  ) {}
  
  /**
   * Get all employees with optional filtering
   */
  getEmployees(options: {
    skip?: number,
    limit?: number,
    store_id?: string,
    position?: string,
    employment_status?: string
  } = {}): Observable<Employee[]> {
    let params = new HttpParams();
    
    if (options.skip !== undefined) params = params.set('skip', options.skip.toString());
    if (options.limit !== undefined) params = params.set('limit', options.limit.toString());
    if (options.store_id) params = params.set('store_id', options.store_id);
    if (options.position) params = params.set('position', options.position);
    if (options.employment_status) params = params.set('employment_status', options.employment_status);
    
    return this.http.get<Employee[]>(this.apiUrl, { params }).pipe(
      tap(employees => console.log(`Fetched ${employees.length} employees`)),
      switchMap(employees => this.enhanceEmployeeData(employees)),
      catchError(this.handleError<Employee[]>('getEmployees', []))
    );
  }
  
  /**
   * Get employee by ID
   */
  getEmployeeById(id: string): Observable<Employee> {
    const url = `${this.apiUrl}/${id}`;
    return this.http.get<Employee>(url).pipe(
      tap(_ => console.log(`Fetched employee id=${id}`)),
      switchMap(employee => this.enhanceEmployeeData([employee]).pipe(
        map(employees => employees[0])
      )),
      catchError(this.handleError<Employee>(`getEmployeeById id=${id}`))
    );
  }
  
  /**
   * Get employees by store
   */
  getEmployeesByStore(storeId: string): Observable<Employee[]> {
    return this.getEmployees({ store_id: storeId });
  }
  
  /**
   * Create a new employee
   */
  createEmployee(employee: Partial<Employee>): Observable<Employee> {
    return this.http.post<Employee>(this.apiUrl, employee).pipe(
      tap((newEmployee: Employee) => console.log(`Created employee id=${newEmployee._id}`)),
      switchMap(employee => this.enhanceEmployeeData([employee]).pipe(
        map(employees => employees[0])
      )),
      catchError(this.handleError<Employee>('createEmployee'))
    );
  }
  
  /**
   * Update an existing employee
   */
  updateEmployee(id: string, employee: Partial<Employee>): Observable<Employee> {
    const url = `${this.apiUrl}/${id}`;
    return this.http.put<Employee>(url, employee).pipe(
      tap(_ => console.log(`Updated employee id=${id}`)),
      switchMap(employee => this.enhanceEmployeeData([employee]).pipe(
        map(employees => employees[0])
      )),
      catchError(this.handleError<Employee>(`updateEmployee id=${id}`))
    );
  }
  
  /**
   * Delete an employee
   */
  deleteEmployee(id: string): Observable<boolean> {
    const url = `${this.apiUrl}/${id}`;
    return this.http.delete<boolean>(url).pipe(
      tap(_ => console.log(`Deleted employee id=${id}`)),
      catchError(this.handleError<boolean>(`deleteEmployee id=${id}`))
    );
  }
  
  /**
   * Change employee status
   */
  changeEmploymentStatus(id: string, status: 'active' | 'on_leave' | 'terminated'): Observable<Employee> {
    return this.updateEmployee(id, { employment_status: status });
  }
  
  /**
   * Assign employee to a store
   */
  assignEmployeeToStore(employeeId: string, storeId: string): Observable<Employee> {
    return this.updateEmployee(employeeId, { store_id: storeId });
  }
  
  /**
   * Helper method to enhance employee data with user and store information
   */
  private enhanceEmployeeData(employees: Employee[]): Observable<Employee[]> {
    if (employees.length === 0) {
      return of([]);
    }
    
    // Get unique user IDs and store IDs
    const userIds = Array.from(new Set(employees
      .filter(emp => !!emp.user_id)
      .map(emp => emp.user_id)));
      
    const storeIds = Array.from(new Set(employees
      .filter(emp => !!emp.store_id)
      .map(emp => emp.store_id)));
    
    // Create observables for fetching user and store data
    const userRequests: Observable<any>[] = userIds.map(id => 
      this.userService.getUserById(id as string).pipe(
        catchError(error => {
          console.error(`Error fetching user info for ID ${id}:`, error);
          return of(null);
        })
      )
    );
    
    const storeRequests: Observable<any>[] = storeIds.map(id => 
      this.storeService.getStoreById(id as string).pipe(
        catchError(error => {
          console.error(`Error fetching store info for ID ${id}:`, error);
          return of(null);
        })
      )
    );
    
    // Combine all requests
    return forkJoin({
      users: userIds.length ? forkJoin(userRequests) : of([]),
      stores: storeIds.length ? forkJoin(storeRequests) : of([])
    }).pipe(
      map(({ users, stores }) => {
        // Create maps for quick lookups
        const userMap = new Map();
        users.forEach(user => {
          if (user) {
            userMap.set(user._id, user);
          }
        });
        
        const storeMap = new Map();
        stores.forEach(store => {
          if (store) {
            storeMap.set(store._id, store);
          }
        });
        
        // Enhance each employee with user and store data
        return employees.map(employee => {
          const enhancedEmployee = { ...employee };
          
          if (employee.user_id && userMap.has(employee.user_id)) {
            const user = userMap.get(employee.user_id);
            enhancedEmployee.full_name = user.full_name;
            enhancedEmployee.email = user.email;
            enhancedEmployee.phone_number = user.phone_number;
          }
          
          if (employee.store_id && storeMap.has(employee.store_id)) {
            const store = storeMap.get(employee.store_id);
            enhancedEmployee.store_name = store.name;
          }
          
          return enhancedEmployee;
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
      
      // Let the app keep running by returning an empty result
      return of(result as T);
    };
  }

 /**
 * Get employee by user ID
 */
getEmployeeByUserId(userId: string): Observable<Employee | null> {
  // Create params to filter by user_id
  let params = new HttpParams().set('user_id', userId);
  
  return this.http.get<Employee[]>(this.apiUrl, { params }).pipe(
    switchMap(employees => this.enhanceEmployeeData(employees)),
    map(employees => employees.length > 0 ? employees[0] : null),
    tap(employee => {
      if (employee) {
        console.log(`Found employee for user id=${userId}`);
      } else {
        console.log(`No employee found for user id=${userId}`);
      }
    }),
    catchError(this.handleError<Employee | null>(`getEmployeeByUserId userId=${userId}`, null))
  );
}
  
}