// src/app/core/auth/permission.service.ts
import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, filter, map, switchMap, tap } from 'rxjs/operators';
import { Role } from '../../shared/models/role.model';

@Injectable({
  providedIn: 'root'
})
export class PermissionService {
  private userPermissionsSubject = new BehaviorSubject<string[]>([]);
  public userPermissions$ = this.userPermissionsSubject.asObservable();
  
  constructor(
    private authService: AuthService,
    private http: HttpClient
  ) {
    // Subscribe to user changes to update permissions
    this.authService.currentUser$.pipe(
      filter(user => !!user),
      switchMap(user => {
        if (user?.role_id) {
          return this.fetchRolePermissions(user.role_id);
        }
        return of([]);
      })
    ).subscribe(permissions => {
      this.userPermissionsSubject.next(permissions);
    });
  }
  
  private fetchRolePermissions(roleId: string): Observable<string[]> {
    // Fetch permissions from the server
    return this.http.get<Role>(`/api/v1/roles/${roleId}`).pipe(
      map(role => role.permissions || []),
      catchError(error => {
        console.error('Failed to fetch role permissions', error);
        return of([]);
      }),
      tap(permissions => {
        console.log('Fetched permissions:', permissions);
      })
    );
  }
  
  hasPermission(permission: string): boolean {
    const permissions = this.userPermissionsSubject.value;
    return permissions.includes(permission);
  }
  
  hasAnyPermission(permissions: string[]): boolean {
    return permissions.some(permission => this.hasPermission(permission));
  }
  
  hasAllPermissions(permissions: string[]): boolean {
    return permissions.every(permission => this.hasPermission(permission));
  }
  
  // Utility function to check if user can perform an action on a resource
  canPerform(resource: string, action: string): boolean {
    const permission = `${resource}:${action}`;
    return this.hasPermission(permission);
  }
  
  // Get all permissions for a specific resource
  getResourcePermissions(resource: string): string[] {
    const permissions = this.userPermissionsSubject.value;
    return permissions.filter(p => p.startsWith(`${resource}:`));
  }
  
  // Check if the user has any permissions for a resource
  hasResourceAccess(resource: string): boolean {
    const resourcePermissions = this.getResourcePermissions(resource);
    return resourcePermissions.length > 0;
  }
  
  // Get all resources the user has access to
  getAccessibleResources(): string[] {
    const permissions = this.userPermissionsSubject.value;
    const resources = new Set<string>();
    
    permissions.forEach(permission => {
      const resource = permission.split(':')[0];
      if (resource) {
        resources.add(resource);
      }
    });
    
    return Array.from(resources);
  }
  
  // Get role-based identifier for the current user
  getRoleIdentifier(): 'admin' | 'manager' | 'employee' | 'unknown' {
    const user = this.authService.currentUser;
    
    if (!user) return 'unknown';
    
    // Check for admin permissions
    if (this.hasPermission('users:delete') && this.hasPermission('roles:write')) {
      return 'admin';
    }
    
    // Check for manager permissions
    if (this.hasPermission('employees:approve') && this.hasPermission('hours:approve')) {
      return 'manager';
    }
    
    // Default to employee
    if (this.hasPermission('hours:read')) {
      return 'employee';
    }
    
    return 'unknown';
  }
  
  // Helper method to determine if the user is an admin
  isAdmin(): boolean {
    return this.getRoleIdentifier() === 'admin';
  }
  
  // Helper method to determine if the user is a manager
  isManager(): boolean {
    return this.getRoleIdentifier() === 'manager';
  }
  
  // Helper method to determine if the user is an employee
  isEmployee(): boolean {
    return this.getRoleIdentifier() === 'employee';
  }
}