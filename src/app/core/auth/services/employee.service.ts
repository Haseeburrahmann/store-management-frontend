// src/app/core/services/employee.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Employee, EmployeeCreate, EmployeeUpdate } from '../models/employee.model';

@Injectable({
  providedIn: 'root'
})
export class EmployeeService {
  private apiUrl = `${environment.apiUrl}/employees`;

  constructor(private http: HttpClient) { }

  getEmployees(
    skip: number = 0, 
    limit: number = 10, 
    store_id?: string, 
    search?: string,
    status?: string
  ): Observable<Employee[]> {
    let params = new HttpParams()
      .set('skip', skip.toString())
      .set('limit', limit.toString());
    
    if (store_id) {
      params = params.set('store_id', store_id);
    }
    
    if (search) {
      params = params.set('search', search);
    }
    
    if (status) {
      params = params.set('status', status);
    }
    
    return this.http.get<Employee[]>(this.apiUrl, { params });
  }

  getEmployeeById(id: string): Observable<Employee> {
    return this.http.get<Employee>(`${this.apiUrl}/${id}`);
  }

  getEmployeesByStore(storeId: string): Observable<Employee[]> {
    return this.http.get<Employee[]>(`${this.apiUrl}/store/${storeId}`);
  }

  createEmployee(employee: EmployeeCreate): Observable<Employee> {
    return this.http.post<Employee>(this.apiUrl, employee);
  }

  updateEmployee(id: string, employee: EmployeeUpdate): Observable<Employee> {
    return this.http.put<Employee>(`${this.apiUrl}/${id}`, employee);
  }

  deleteEmployee(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  // src/app/core/services/employee.service.ts
assignEmployeeToStore(employeeId: string, storeId: string): Observable<Employee> {
    console.log(`Assigning employee ${employeeId} to store ${storeId}`);
    
    // Ensure IDs are strings
    const empId = employeeId.toString();
    const stoId = storeId.toString();
    
    return this.http.put<Employee>(
      `${this.apiUrl}/${empId}/assign-store/${stoId}`, 
      {}
    );
  }
}