// src/app/core/auth/auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { User } from '../../shared/models/user.model';
import { LoginResponse } from '../../shared/models/auth.model';
import { Router } from '@angular/router';

// Define a type for user permissions to be included with user data
export interface UserWithPermissions extends User {
  permissions?: string[];
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<UserWithPermissions | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  
  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    this.loadUserFromStorage();
  }
  
  login(email: string, password: string): Observable<UserWithPermissions> {
    console.log('Auth Service: Attempting login for', email);
    const formData = new FormData();
    formData.append('username', email);
    formData.append('password', password);
    
    return this.http.post<LoginResponse>('/api/v1/auth/login', formData).pipe(
      tap(response => {
        console.log('Auth Service: Login successful, received token');
        localStorage.setItem('token', response.access_token);
      }),
      switchMap(() => {
        console.log('Auth Service: Fetching current user profile');
        return this.fetchCurrentUser();
      }),
      tap(user => {
        console.log('Auth Service: User profile loaded successfully', user);
      }),
      catchError(error => {
        console.error('Auth Service: Login error:', error);
        return throwError(() => new Error(error.error?.detail || 'Authentication failed'));
      })
    );
  }
  
  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.currentUserSubject.next(null);
    this.router.navigate(['/auth/login']);
  }
  
  register(userData: Partial<User>): Observable<User> {
    return this.http.post<User>('/api/v1/auth/register', userData);
  }
  
  fetchCurrentUser(): Observable<UserWithPermissions> {
    return this.http.get<UserWithPermissions>('/api/v1/auth/me').pipe(
      switchMap(user => {
        // Try to fetch user permissions based on role
        return this.fetchUserPermissions(user).pipe(
          map(permissions => {
            // Add permissions to user object
            return { ...user, permissions };
          }),
          catchError(() => {
            // If permissions fetch fails, return user without permissions
            console.warn('Auth Service: Could not fetch permissions, continuing with user data only');
            return of(user);
          })
        );
      }),
      tap(user => {
        this.currentUserSubject.next(user);
        localStorage.setItem('user', JSON.stringify(user));
      }),
      catchError(error => {
        console.error('Error fetching user profile:', error);
        this.logout();
        return throwError(() => new Error('Failed to fetch user profile'));
      })
    );
  }
  
  private fetchUserPermissions(user: User): Observable<string[]> {
    console.log('Auth Service: Attempting to fetch permissions for role', user.role_id);
    
    // First, try to get permissions from dedicated user permissions endpoint
    // This should be implemented in your backend in the future
    return this.http.get<{ permissions: string[] }>(`/api/v1/auth/permissions`).pipe(
      map(response => {
        console.log('Auth Service: Received permissions from dedicated endpoint', response.permissions);
        return response.permissions;
      }),
      catchError(() => {
        console.log('Auth Service: No dedicated permissions endpoint, trying role endpoint');
        
        // If that fails, try to get from roles endpoint (may fail due to permissions)
        return this.http.get<{ permissions: string[] }>(`/api/v1/roles/${user.role_id}`).pipe(
          map(role => {
            console.log('Auth Service: Received permissions from role endpoint', role.permissions);
            // Handle stock_requests vs stock-requests inconsistency
            return (role.permissions || []).map(perm => 
              perm.replace('stock_requests', 'stock-requests')
            );
          }),
          catchError(error => {
            console.warn('Auth Service: Could not fetch role permissions:', error);
            
            // Infer basic permissions based on role ID to handle permission errors
            let inferredPermissions: string[] = [];
            
            // Basic permission inference
            if (user.role_id === '67c9fb4d9db05f47c32b6b22') {
              // Admin role
              console.log('Auth Service: Using inferred admin permissions');
              inferredPermissions = this.getAdminPermissions();
            } else if (user.role_id === '67c9fb4d9db05f47c32b6b23') {
              // Manager role
              console.log('Auth Service: Using inferred manager permissions');
              inferredPermissions = this.getManagerPermissions();
            } else {
              // Default to employee permissions
              console.log('Auth Service: Using inferred employee permissions');
              inferredPermissions = this.getEmployeePermissions();
            }
            
            return of(inferredPermissions);
          })
        );
      })
    );
  }
  
  private getAdminPermissions(): string[] {
    // Basic admin permissions
    return [
      'users:read', 'users:write', 'users:delete',
      'roles:read', 'roles:write',
      'stores:read', 'stores:write',
      'employees:read', 'employees:write', 'employees:approve',
      'hours:read', 'hours:write', 'hours:approve'
    ];
  }
  
  private getManagerPermissions(): string[] {
    // Basic manager permissions
    return [
      'users:read',
      'stores:read', 'stores:write',
      'employees:read', 'employees:write', 'employees:approve',
      'hours:read', 'hours:write', 'hours:approve',
      'inventory:read', 'inventory:write',
      'stock-requests:read', 'stock-requests:write', 'stock-requests:approve'
    ];
  }
  
  private getEmployeePermissions(): string[] {
    // Basic employee permissions
    return [
      'users:read',
      'stores:read',
      'employees:read',
      'hours:read', 'hours:write',
      'inventory:read',
      'stock-requests:read', 'stock-requests:write'
    ];
  }
  
  private loadUserFromStorage(): void {
    const userJson = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (userJson && token) {
      try {
        const user = JSON.parse(userJson);
        this.currentUserSubject.next(user);
      } catch (e) {
        localStorage.removeItem('user');
      }
    }
  }
  
  get isAuthenticated(): boolean {
    return !!this.currentUserSubject.value && !!localStorage.getItem('token');
  }
  
  get currentUser(): UserWithPermissions | null {
    return this.currentUserSubject.value;
  }
}