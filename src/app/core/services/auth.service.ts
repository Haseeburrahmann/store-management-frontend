import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map, tap, catchError, switchMap, filter, throwIfEmpty } from 'rxjs/operators';

import { ApiService } from './api.service';
import { API_CONFIG } from '../config/api-config';
import { User } from '../../shared/models/user.model';

interface LoginResponse {
  access_token: string;
  token_type: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$: Observable<User | null> = this.currentUserSubject.asObservable();
  
  private tokenKey = 'auth_token';
  
  constructor(private apiService: ApiService) {
    // Load user from storage on initialization
    this.loadUserFromStorage();
  }
  
  /**
   * Get the current user value
   */
  public get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }
  
  /**
   * Get the stored JWT token
   */
  public get token(): string | null {
    return localStorage.getItem(this.tokenKey);
  }
  
  /**
   * Check if the user is authenticated
   */
  public get isAuthenticated(): boolean {
    return !!this.token;
  }

  /**
   * Login with email and password
   */
  login(email: string, password: string): Observable<User> {
    const body = new URLSearchParams();
    body.set('username', email);
    body.set('password', password);
  
    const headers = new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded'
    });
  
    return this.apiService
      .post<LoginResponse>(API_CONFIG.auth.login, body.toString(), headers)
      .pipe(
        tap(response => {
          // Store the token
          localStorage.setItem(this.tokenKey, response.access_token);
        }),
        // Fetch user details after login
        switchMap(() => this.loadCurrentUser()),
        filter((user): user is User => !!user),
        throwIfEmpty(() => new Error('Failed to load user data after login'))
      );
  }
  /**
   * Register a new user
   */
  register(userData: { email: string; password: string; full_name: string; }): Observable<User> {
    return this.apiService.post<User>(API_CONFIG.auth.register, userData);
  }

  /**
   * Logout the current user
   */
  logout(): void {
    // Clear token and user data
    localStorage.removeItem(this.tokenKey);
    this.currentUserSubject.next(null);
  }

  /**
 * Load the current authenticated user
 */
  loadCurrentUser(): Observable<User | null> {
    // Skip if no token exists
    if (!this.token) {
      this.currentUserSubject.next(null);
      return of(null);
    }
    
    return this.apiService.get<User>(API_CONFIG.auth.me).pipe(
      tap(user => {
        this.currentUserSubject.next(user);
      }),
      catchError(error => {
        // Handle invalid token
        this.logout();
        return of(null);
      })
    );
  }

  /**
   * Check if user has permission
   */
  hasPermission(permission: string): boolean {
    const user = this.currentUserValue;
    if (!user || !user.permissions) {
      return false;
    }
    const hasPermission = user.permissions.includes(permission);
    console.log(`Has permission ${permission}:`, hasPermission);
    return user.permissions.includes(permission);
  }

  /**
   * Load user data from storage on application start
   */
  private loadUserFromStorage(): void {
    if (this.token) {
      this.loadCurrentUser().subscribe();
    }
  }
}