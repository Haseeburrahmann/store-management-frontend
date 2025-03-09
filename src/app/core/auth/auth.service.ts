// src/app/core/auth/auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { User } from '../../shared/models/user.model';
import { LoginResponse } from '../../shared/models/auth.model';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  
  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    this.loadUserFromStorage();
  }
  
  /**
   * Login with email and password
   */
  login(email: string, password: string): Observable<User> {
    const loginData = { email, password };
    
    return this.http.post<LoginResponse>('/api/v1/auth/login', loginData).pipe(
      tap(response => {
        localStorage.setItem('token', response.access_token);
      }),
      switchMap(() => this.fetchCurrentUser()),
      catchError(error => {
        console.error('Login error:', error);
        
        // For development - mock successful login if API is not available
        if (!environment.production && environment.useMockAuth) {
          console.warn('[DEV] Using mock authentication due to API error');
          return this.mockLogin(email);
        }
        
        return throwError(() => new Error(error.error?.detail || 'Authentication failed'));
      })
    );
  }
  
  /**
   * Register a new user
   */
  register(userData: Partial<User>): Observable<User> {
    return this.http.post<User>('/api/v1/auth/register', userData).pipe(
      catchError(error => {
        console.error('Registration error:', error);
        
        // For development - mock successful registration if API is not available
        if (!environment.production && environment.useMockAuth) {
          console.warn('[DEV] Using mock registration due to API error');
          return this.mockRegister(userData);
        }
        
        return throwError(() => new Error(error.error?.detail || 'Registration failed'));
      })
    );
  }
  
  /**
   * Logout the current user
   */
  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.currentUserSubject.next(null);
    this.router.navigate(['/auth/login']);
  }
  
  /**
   * Fetch the current user's profile
   */
  fetchCurrentUser(): Observable<User> {
    return this.http.get<User>('/api/v1/auth/me').pipe(
      tap(user => {
        this.currentUserSubject.next(user);
        localStorage.setItem('user', JSON.stringify(user));
      }),
      catchError(error => {
        console.error('Error fetching user profile:', error);
        
        // For development - use stored user if available when API fails
        const storedUser = localStorage.getItem('user');
        if (!environment.production && environment.useMockAuth && storedUser) {
          console.warn('[DEV] Using stored user due to API error');
          const user = JSON.parse(storedUser);
          this.currentUserSubject.next(user);
          return of(user);
        }
        
        this.logout();
        return throwError(() => new Error('Failed to fetch user profile'));
      })
    );
  }
  
  /**
   * Load user from local storage
   */
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
  
  /**
   * Check if the user is authenticated
   */
  get isAuthenticated(): boolean {
    return !!this.currentUserSubject.value && !!localStorage.getItem('token');
  }
  
  /**
   * Get the current user
   */
  get currentUser(): User | null {
    debugger;
    return this.currentUserSubject.value;
  }
  
  /**
   * Mock login for development purposes
   */
  private mockLogin(email: string): Observable<User> {
    console.warn('[DEV] Using mock login');
    
    // Generate a mock user based on email
    const mockUser: User = {
      _id: 'mock-user-id',
      email: email,
      full_name: email.split('@')[0].replace(/[^a-zA-Z]/g, ' '),
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      role_id: email.includes('admin') ? 'admin' : 
               email.includes('manager') ? 'manager' : 'employee'
    };
    
    // Store mock token and user
    localStorage.setItem('token', 'mock-jwt-token');
    localStorage.setItem('user', JSON.stringify(mockUser));
    
    // Update current user
    this.currentUserSubject.next(mockUser);
    
    return of(mockUser);
  }
  
  /**
   * Mock register for development purposes
   */
  private mockRegister(userData: Partial<User>): Observable<User> {
    console.warn('[DEV] Using mock registration');
    
    // Generate a mock user based on provided data
    const mockUser: User = {
      _id: 'mock-' + Math.random().toString(36).substring(2, 10),
      email: userData.email || 'mock@example.com',
      full_name: userData.full_name || 'Mock User',
      phone_number: userData.phone_number,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      role_id: 'employee' // Default role for new users
    };
    
    return of(mockUser);
  }
}