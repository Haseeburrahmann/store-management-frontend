// src/app/core/auth/services/auth.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError, of } from 'rxjs';
import { catchError, tap, switchMap, map } from 'rxjs/operators';
import { Router } from '@angular/router';
import { User, UserCreate, UserWithPermissions } from '../auth/models/user.model';
import { environment } from '../../../environments/environment';
import { ApiService } from '../services/api.service';
import { TokenService } from '../services/token.service';

interface AuthResponse {
  access_token: string;
  token_type: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = '/auth';
  private userSubject = new BehaviorSubject<UserWithPermissions | null>(null);
  public user$ = this.userSubject.asObservable();

  constructor(
    private http: HttpClient, 
    private router: Router,
    private apiService: ApiService,
    private tokenService: TokenService // Inject TokenService
  ) {
    this.loadUser();
  }

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
          console.error('Login error:', error);
          return throwError(() => new Error(error.message || 'Login failed. Please check your credentials.'));
        })
      );
  }
  
  register(userData: UserCreate): Observable<User> {
    return this.apiService.post<User>(`${this.apiUrl}/register`, userData);
  }

  logout(): void {
    // Use TokenService to remove token
    this.tokenService.removeToken();
    this.userSubject.next(null);
    this.router.navigate(['/login']);
  }

  loadUserProfile(): Observable<UserWithPermissions> {
    if (!this.isAuthenticated()) {
      return throwError(() => new Error('Not authenticated'));
    }
    
    return this.apiService.get<UserWithPermissions>(`${this.apiUrl}/me`)
      .pipe(
        tap(user => {
          // Normalize permissions to handle both formats
          if (user.permissions) {
            user.permissions = this.normalizePermissions(user.permissions);
          }
          this.userSubject.next(user);
        }),
        catchError(error => {
          console.error('Error loading user profile:', error);
          // Use TokenService to remove token
          this.tokenService.removeToken();
          this.userSubject.next(null);
          return throwError(() => error);
        })
      );
  }

  public loadUser(): void {
    if (this.isAuthenticated()) {
      this.loadUserProfile().subscribe({
        error: () => {
          // Handle silently - errors are already logged in loadUserProfile
        }
      });
    }
  }

  isAuthenticated(): boolean {
    // Use TokenService to check if authenticated
    return this.tokenService.hasToken();
  }

  getToken(): string | null {
    // Use TokenService to get token
    return this.tokenService.getToken();
  }

  /**
   * Normalizes an array of permissions to handle both formats
   * @param permissions Array of permissions in any format
   * @returns Normalized permissions array
   */
  private normalizePermissions(permissions: string[]): string[] {
    // Create a set to avoid duplicates
    const normalizedSet = new Set<string>();
    
    permissions.forEach(permission => {
      // Add the original permission
      normalizedSet.add(permission);
      
      // If it's in the enum format (PermissionArea.X:PermissionAction.Y)
      if (permission.includes('PermissionArea')) {
        const match = permission.match(/PermissionArea\.(\w+):PermissionAction\.(\w+)/);
        if (match && match.length === 3) {
          const [_, area, action] = match;
          // Add the simple format (area:action)
          normalizedSet.add(`${area.toLowerCase()}:${action.toLowerCase()}`);
        }
      } 
      // If it's in the simple format (area:action)
      else if (permission.includes(':')) {
        const [area, action] = permission.split(':');
        // Add the enum format (PermissionArea.AREA:PermissionAction.ACTION)
        normalizedSet.add(`PermissionArea.${area.toUpperCase()}:PermissionAction.${action.toUpperCase()}`);
        
        // Add version with plural/singular variations
        if (!area.toUpperCase().endsWith('S')) {
          // Add plural version
          normalizedSet.add(`PermissionArea.${area.toUpperCase()}S:PermissionAction.${action.toUpperCase()}`);
        } else {
          // Add singular version (remove trailing 'S')
          const singularArea = area.toUpperCase().slice(0, -1);
          normalizedSet.add(`PermissionArea.${singularArea}:PermissionAction.${action.toUpperCase()}`);
        }
      }
    });
    
    return Array.from(normalizedSet);
  }

  /**
   * Check if the current user has a specific permission
   * @param permissionArea The permission area (e.g., 'users', 'stores')
   * @param permissionAction The permission action (e.g., 'read', 'write')
   * @returns boolean indicating if the user has the permission
   */
  public hasPermission(permissionArea: string, permissionAction: string): boolean {
    const user = this.userSubject.value;
    
    // Check if user is admin, and return true for all permissions
    if (user && user.email === 'admin@example.com') {
      return true;
    }
    
    if (!user || !user.permissions || user.permissions.length === 0) {
      return false;
    }
    
    // Generate all possible formats of the permission
    const permissionFormats = [
      // Simple format
      `${permissionArea.toLowerCase()}:${permissionAction.toLowerCase()}`,
      // Enum format
      `PermissionArea.${permissionArea.toUpperCase()}:PermissionAction.${permissionAction.toUpperCase()}`
    ];
    
    // If permissionArea doesn't end with 's', add plural version
    if (!permissionArea.toLowerCase().endsWith('s')) {
      permissionFormats.push(`${permissionArea.toLowerCase()}s:${permissionAction.toLowerCase()}`);
      permissionFormats.push(`PermissionArea.${permissionArea.toUpperCase()}S:PermissionAction.${permissionAction.toUpperCase()}`);
    }
    // If permissionArea ends with 's', add singular version
    else {
      const singularArea = permissionArea.toLowerCase().slice(0, -1);
      permissionFormats.push(`${singularArea}:${permissionAction.toLowerCase()}`);
      
      const singularEnumArea = permissionArea.toUpperCase().slice(0, -1);
      permissionFormats.push(`PermissionArea.${singularEnumArea}:PermissionAction.${permissionAction.toUpperCase()}`);
    }
    
    // Check if user has any of the permission formats
    return permissionFormats.some(format => user.permissions!.includes(format));
  }
  
  /**
   * Legacy method for backward compatibility
   * @param permission Full permission string
   * @returns boolean indicating if the user has the permission
   */
  public hasPermissionLegacy(permission: string): boolean {
    const user = this.userSubject.value;
    
    // Check if user is admin, and return true for all permissions
    if (user && user.email === 'admin@example.com') {
      return true;
    }
    
    if (!user || !user.permissions || user.permissions.length === 0) {
      return false;
    }
    
    // Direct check if user has the exact permission
    if (user.permissions.includes(permission)) {
      return true;
    }
    
    // Handle both formats
    if (permission.includes(':')) {
      // If permission is in simple format (area:action)
      if (!permission.includes('PermissionArea')) {
        const [area, action] = permission.split(':');
        return this.hasPermission(area, action);
      }
      // If permission is in enum format (PermissionArea.AREA:PermissionAction.ACTION)
      else {
        const match = permission.match(/PermissionArea\.(\w+):PermissionAction\.(\w+)/);
        if (match && match.length === 3) {
          const [_, area, action] = match;
          return this.hasPermission(area, action);
        }
      }
    }
    
    return false;
  }
}