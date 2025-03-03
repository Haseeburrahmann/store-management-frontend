import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User, UserUpdate } from '../models/user.model';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = `${environment.apiUrl}/users`;

  constructor(private http: HttpClient) { }

  getUsers(skip: number = 0, limit: number = 10): Observable<User[]> {
    debugger;
    return this.http.get<User[]>(`${this.apiUrl}?skip=${skip}&limit=${limit}`);
  }

  getUser(id: string): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/${id}`);
  }

  updateUser(id: string, userData: UserUpdate): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/${id}`, userData);
  }

  deleteUser(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  getCurrentUser(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/me`);
  }

  updateCurrentUser(userData: UserUpdate): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/me`, userData);
  }

  // And also add createUser method if not already present:
  createUser(userData: any): Observable<User> {
    return this.http.post<User>(this.apiUrl, userData);
  }
}