// src/app/core/services/user.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { User } from '../../shared/models/user.model';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = '/api/v1/users';
  
  constructor(private http: HttpClient) {}
  
  /**
   * Get all users with optional filtering
   */
  getUsers(options: {
    skip?: number,
    limit?: number,
    email?: string,
    role_id?: string
  } = {}): Observable<User[]> {
    let params = new HttpParams();
    
    if (options.skip !== undefined) params = params.set('skip', options.skip.toString());
    if (options.limit !== undefined) params = params.set('limit', options.limit.toString());
    if (options.email) params = params.set('email', options.email);
    if (options.role_id) params = params.set('role_id', options.role_id);
    
    return this.http.get<User[]>(this.apiUrl, { params }).pipe(
      tap(users => console.log(`Fetched ${users.length} users`)),
      catchError(this.handleError<User[]>('getUsers', []))
    );
  }
  
  /**
   * Get user by ID
   */
  getUserById(id: string): Observable<User> {
    const url = `${this.apiUrl}/${id}`;
    return this.http.get<User>(url).pipe(
      tap(_ => console.log(`Fetched user id=${id}`)),
      catchError(this.handleError<User>(`getUserById id=${id}`))
    );
  }
  
  /**
   * Get current user profile
   */
  getCurrentUser(): Observable<User> {
    const url = `${this.apiUrl}/me`;
    return this.http.get<User>(url).pipe(
      tap(user => console.log('Fetched current user')),
      catchError(this.handleError<User>('getCurrentUser'))
    );
  }
  
  /**
   * Create a new user
   */
  createUser(user: Partial<User>): Observable<User> {
    return this.http.post<User>(this.apiUrl, user).pipe(
      tap((newUser: User) => console.log(`Created user id=${newUser._id}`)),
      catchError(this.handleError<User>('createUser'))
    );
  }
  
  /**
   * Update an existing user
   */
  updateUser(id: string, user: Partial<User>): Observable<User> {
    const url = `${this.apiUrl}/${id}`;
    return this.http.put<User>(url, user).pipe(
      tap(_ => console.log(`Updated user id=${id}`)),
      catchError(this.handleError<User>(`updateUser id=${id}`))
    );
  }
  
  /**
   * Delete a user
   */
  deleteUser(id: string): Observable<boolean> {
    const url = `${this.apiUrl}/${id}`;
    return this.http.delete<boolean>(url).pipe(
      tap(_ => console.log(`Deleted user id=${id}`)),
      catchError(this.handleError<boolean>(`deleteUser id=${id}`))
    );
  }
  
  /**
   * Change user password
   */
  changePassword(currentPassword: string, newPassword: string): Observable<void> {
    const url = `${this.apiUrl}/change-password`;
    return this.http.post<void>(url, {
      current_password: currentPassword,
      new_password: newPassword
    }).pipe(
      tap(_ => console.log('Changed password')),
      catchError(this.handleError<void>('changePassword'))
    );
  }
  
  /**
   * Get users by role
   */
  getUsersByRole(roleId: string): Observable<User[]> {
    return this.getUsers({ role_id: roleId });
  }
  
  /**
   * Assign role to user
   */
  assignRole(userId: string, roleId: string): Observable<User> {
    return this.updateUser(userId, { role_id: roleId });
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
}