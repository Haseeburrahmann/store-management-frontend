// src/app/core/services/auth.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError, of } from 'rxjs';
import { catchError, tap, switchMap, map } from 'rxjs/operators';
import { Router } from '@angular/router';
import { User, UserCreate, UserWithPermissions } from '../auth/models/user.model';
import { environment } from '../../../environments/environment';
import { ApiService } from './api.service';
import { TokenService } from './token.service';
import { hasPermission, normalizePermissions } from '../utils/permission';
import { createAppError, AppError, ErrorType } from '../utils/error-handler';

interface AuthResponse {
  access_token: string;
  token_type: string;
}

/**
 * Enhanced AuthService with standardized permission handling
 * and improved error management
 */
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = '/auth';
  private userSubject = new BehaviorSubject<UserWithPermissions | null>(null);
  
  /**
   * Observable for user data - components can subscribe to this
   * to receive updates when the user changes
   */
  public user$ = this.userSubject.asObservable();

  constructor(
    private http: HttpClient, 
    private router: Router,
    private apiService: ApiService,
    private tokenService: TokenService
  ) {
    this.loadUser();
  }

  /**
   * Log in a user with email and password
   * 
   * @param email User email
   * @param password User password
   * @returns Observable of logged in user with permissions
   */
  login(email: string, password: string): Observable<UserWithPermissions> {
    const formData = new FormData();
    formData.append('username', email);
    formData.append('password', password);
    
    return this.apiService.post<AuthResponse>(`${this.apiUrl}/login`, formData)
      .pipe(
        tap(response => {
          this.tokenService.setToken(response.access_token);
        }),
        switchMap(() => this.loadUserProfile()),
        catchError(error => {
          const appError = createAppError(error);
          
          // Set specific error type based on context
          if (appError.type === ErrorType.UNKNOWN) {
            appError.type = ErrorType.AUTHENTICATION;
            appError.message = 'Login failed. Please check your credentials.';
          }
          
          console.error('Login error:', appError);
          return throwError(() => appError);
        })
      );
  }
  
  /**
   * Register a new user
   * 
   * @param userData User registration data
   * @returns Observable of created user
   */
  register(userData: UserCreate): Observable<User> {
    return this.apiService.post<User>(`${this.apiUrl}/register`, userData)
      .pipe(
        catchError(error => {
          const appError = createAppError(error);
          
          // Set specific context for registration errors
          if (appError.type === ErrorType.VALIDATION) {
            appError.message = 'Registration failed. Please check your information.';
          } else {
            appError.message = 'Registration failed. Please try again.';
          }
          
          console.error('Registration error:', appError);
          return throwError(() => appError);
        })
      );
  }

  /**
   * Log out the current user and redirect to login page
   */
  logout(): void {
    this.tokenService.removeToken();
    this.userSubject.next(null);
    this.router.navigate(['/login']);
  }

  /**
   * Load the current user's profile and permissions
   * 
   * @returns Observable of user with permissions
   */
  loadUserProfile(): Observable<UserWithPermissions> {
    if (!this.isAuthenticated()) {
      return throwError(() => createAppError({
        type: ErrorType.AUTHENTICATION,
        message: 'Not authenticated'
      }));
    }
    
    return this.apiService.get<UserWithPermissions>(`${this.apiUrl}/me`)
      .pipe(
        map(user => {
          // Normalize permissions for consistent format
          if (user.permissions) {
            user.permissions = normalizePermissions(user.permissions);
          }
          
          this.userSubject.next(user);
          return user;
        }),
        catchError(error => {
          const appError = createAppError(error);
          
          console.error('Error loading user profile:', appError);
          
          // Clear authentication on error
          this.tokenService.removeToken();
          this.userSubject.next(null);
          
          return throwError(() => appError);
        })
      );
  }

  /**
   * Attempt to load the user from token on startup
   */
  public loadUser(): void {
    if (this.isAuthenticated()) {
      this.loadUserProfile().subscribe({
        error: () => {
          // Errors are already handled in loadUserProfile
        }
      });
    }
  }

  /**
   * Check if the user is authenticated (has a token)
   * 
   * @returns True if authenticated
   */
  isAuthenticated(): boolean {
    return this.tokenService.hasToken();
  }

  /**
   * Get the current JWT token
   * 
   * @returns Current token or null
   */
  getToken(): string | null {
    return this.tokenService.getToken();
  }

  /**
   * Check if current user has a specific permission
   * 
   * @param permissionArea Permission area (e.g., 'users')
   * @param permissionAction Permission action (e.g., 'read')
   * @returns True if user has permission
   */
  public hasPermission(permissionArea: string, permissionAction: string): boolean {
    const user = this.userSubject.value;
    
    // Admin user bypass (for testing/development)
    if (user && user.email === 'admin@example.com') {
      return true;
    }
    
    if (!user || !user.permissions || user.permissions.length === 0) {
      return false;
    }
    
    return hasPermission(user.permissions, permissionArea, permissionAction);
  }
  
  /**
   * Check if the user has any permissions for a given area
   * 
   * @param area The permission area to check
   * @returns True if user has any permissions for the area
   */
  public hasAnyPermissionForArea(area: string): boolean {
    const user = this.userSubject.value;
    
    // Admin user bypass
    if (user && user.email === 'admin@example.com') {
      return true;
    }
    
    if (!user || !user.permissions || user.permissions.length === 0) {
      return false;
    }
    
    // Check if any permission starts with the area
    return user.permissions.some(permission => {
      const normalizedPerm = permission.toLowerCase();
      return normalizedPerm.startsWith(`${area.toLowerCase()}:`) ||
             // Handle singular/plural variations
             (area.endsWith('s') && normalizedPerm.startsWith(`${area.slice(0, -1).toLowerCase()}:`)) ||
             (!area.endsWith('s') && normalizedPerm.startsWith(`${area.toLowerCase()}s:`));
    });
  }
  
  /**
   * Legacy method for backward compatibility
   * @param permission Full permission string
   * @returns boolean indicating if the user has the permission
   */
  public hasPermissionLegacy(permission: string): boolean {
    // Don't duplicate code - parse the permission and use the standard method
    if (permission.includes(':')) {
      if (permission.includes('PermissionArea.')) {
        // If permission is in enum format, parse it
        const match = permission.match(/PermissionArea\.(\w+):PermissionAction\.(\w+)/i);
        if (match && match.length === 3) {
          const [_, area, action] = match;
          return this.hasPermission(area, action);
        }
      } else {
        // If permission is in simple format (area:action)
        const [area, action] = permission.split(':');
        return this.hasPermission(area, action);
      }
    }
    
    // If we can't parse the permission, default to false
    return false;
  }
}