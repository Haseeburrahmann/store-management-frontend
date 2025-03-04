import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap } from 'rxjs';
import { Router } from '@angular/router';
import { User, UserCreate, UserWithPermissions } from '../models/user.model';
import { environment } from '../../../../environments/environment';

interface AuthResponse {
  access_token: string;
  token_type: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;
  private userSubject = new BehaviorSubject<UserWithPermissions | null>(null);
  public user$ = this.userSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) {
    this.loadUser();
  }

  login(email: string, password: string): Observable<AuthResponse> {
    const formData = new FormData();
    formData.append('username', email);
    formData.append('password', password);
    
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, formData)
      .pipe(
        tap(response => {
          localStorage.setItem('access_token', response.access_token);
          this.loadUserProfile();
        })
      );
  }

  register(userData: UserCreate): Observable<User> {
    return this.http.post<User>(`${this.apiUrl}/register`, userData);
  }

  logout(): void {
    localStorage.removeItem('access_token');
    this.userSubject.next(null);
    this.router.navigate(['/login']);
  }

  loadUserProfile(): void {
    if (this.isAuthenticated()) {
      this.http.get<UserWithPermissions>(`${this.apiUrl}/me`)
        .subscribe({
          next: (user) => this.userSubject.next(user),
          error: () => {
            localStorage.removeItem('access_token');
            this.userSubject.next(null);
          }
        });
    }
  }

  public loadUser(): void {
    if (this.isAuthenticated()) {
      this.loadUserProfile();
    }
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('access_token');
  }

  getToken(): string | null {
    return localStorage.getItem('access_token');
  }

  public hasPermission(permission: string): boolean {
    const user = this.userSubject.value;
    
    // Check if user is admin by email, and return true for all permissions
    if (user && user.email === 'admin@example.com') {
      // console.log('Admin user detected, granting all permissions');
      return true;
    }
    
    if (!user || !user.permissions || user.permissions.length === 0) {
      // console.log('No permissions found for user:', user);
      return false;
    }
    
    // 1. Direct check if permission is already in full format
    if (user.permissions.includes(permission)) {
      return true;
    }
    
    // 2. Check if we're comparing a simple format against enum format
    if (permission.includes(':') && !permission.includes('PermissionArea')) {
      const [area, action] = permission.split(':');
      
      // Try with exact format (singular)
      const enumPermission = `PermissionArea.${area.toUpperCase()}:PermissionAction.${action.toUpperCase()}`;
      if (user.permissions.includes(enumPermission)) {
        return true;
      }
      
      // Try with plural form
      const pluralEnumPermission = `PermissionArea.${area.toUpperCase()}S:PermissionAction.${action.toUpperCase()}`;
      if (user.permissions.includes(pluralEnumPermission)) {
        return true;
      }
    }
    
    // 3. Check if we're comparing enum format against simple format
    if (permission.includes('PermissionArea')) {
      // Extract area and action from enum format
      const match = permission.match(/PermissionArea\.(\w+):PermissionAction\.(\w+)/);
      if (match && match.length === 3) {
        const [_, area, action] = match;
        
        // Create simple format permission strings to check
        const simplePermission = `${area.toLowerCase()}:${action.toLowerCase()}`;
        const simpleSingularPermission = area.toLowerCase().endsWith('s') ? 
          `${area.toLowerCase().slice(0, -1)}:${action.toLowerCase()}` : 
          simplePermission;
          
        // Check if user has these permissions
        if (user.permissions.includes(simplePermission) || 
            user.permissions.includes(simpleSingularPermission)) {
          return true;
        }
      }
    }
    
    // None of the formats matched
    return false;
  }
}