import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Role, RoleCreate, RoleUpdate } from '../models/role.model';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class RoleService {
  private apiUrl = `${environment.apiUrl}/roles`;

  constructor(private http: HttpClient) { }

  getRoles(skip: number = 0, limit: number = 10): Observable<Role[]> {
    return this.http.get<Role[]>(`${this.apiUrl}?skip=${skip}&limit=${limit}`);
  }

  getRole(id: string): Observable<Role> {
    return this.http.get<Role>(`${this.apiUrl}/${id}`);
  }

  createRole(roleData: RoleCreate): Observable<Role> {
    return this.http.post<Role>(this.apiUrl, roleData);
  }

  updateRole(id: string, roleData: RoleUpdate): Observable<Role> {
    return this.http.put<Role>(`${this.apiUrl}/${id}`, roleData);
  }

  deleteRole(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}