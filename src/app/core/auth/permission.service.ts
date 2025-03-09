// src/app/core/auth/permission.service.ts
import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, filter, map, switchMap, tap } from 'rxjs/operators';
import { Role } from '../../shared/models/role.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PermissionService {
  private userPermissionsSubject = new BehaviorSubject<string[]>([]);
  public userPermissions$ = this.userPermissionsSubject.asObservable();
  
  // Flag to use hardcoded permissions (for development/testing)
  private useHardcodedPermissions = !environment.production && environment.useHardcodedPermissions;
  
  // Hardcoded permission sets for testing purposes
  private hardcodedPermissions = {
    admin: [
      'users:read', 'users:write', 'users:delete', 'users:approve',
      'roles:read', 'roles:write', 'roles:delete', 'roles:approve',
      'stores:read', 'stores:write', 'stores:delete', 'stores:approve',
      'employees:read', 'employees:write', 'employees:delete', 'employees:approve',
      'hours:read', 'hours:write', 'hours:delete', 'hours:approve',
      'payments:read', 'payments:write', 'payments:delete', 'payments:approve',
      'inventory:read', 'inventory:write', 'inventory:delete', 'inventory:approve',
      'stock-requests:read', 'stock-requests:write', 'stock-requests:delete', 'stock-requests:approve',
      'sales:read', 'sales:write', 'sales:delete', 'sales:approve',
      'reports:read', 'reports:write', 'reports:delete', 'reports:approve'
    ],
    manager: [
      'users:read',
      'roles:read',
      'stores:read', 'stores:write',
      'employees:read', 'employees:write', 'employees:approve',
      'hours:read', 'hours:write', 'hours:approve',
      'payments:read', 'payments:write', 'payments:approve',
      'inventory:read', 'inventory:write', 'inventory:approve',
      'stock-requests:read', 'stock-requests:write', 'stock-requests:approve',
      'sales:read', 'sales:write', 'sales:approve',
      'reports:read'
    ],
    employee: [
      'users:read',
      'roles:read',
      'stores:read',
      'employees:read',
      'hours:read', 'hours:write',
      'payments:read',
      'inventory:read',
      'stock-requests:read', 'stock-requests:write',
      'sales:read', 'sales:write'
    ]
  };
  
  constructor(
    private authService: AuthService,
    private http: HttpClient
  ) {
    // Initialize permissions
    this.initPermissions();
    
    // Subscribe to user changes to update permissions
    this.authService.currentUser$.pipe(
      filter(user => !!user)
    ).subscribe(user => {
      this.updatePermissions(user?.role_id);
    });
  }
  
  private initPermissions(): void {
    const user = this.authService.currentUser;
    if (user) {
      this.updatePermissions(user.role_id);
    }
  }
  
  private updatePermissions(roleId?: string): void {
    if (!roleId) {
      this.userPermissionsSubject.next([]);
      return;
    }
    
    if (this.useHardcodedPermissions) {
      this.setHardcodedPermissions(roleId);
    } else {
      this.fetchRolePermissions(roleId).subscribe(permissions => {
        this.userPermissionsSubject.next(permissions);
      });
    }
  }
  
  private setHardcodedPermissions(roleId: string): void {
    let permissions: string[] = [];
    
    if (roleId.toLowerCase().includes('admin')) {
      permissions = this.hardcodedPermissions.admin;
    } else if (roleId.toLowerCase().includes('manager')) {
      permissions = this.hardcodedPermissions.manager;
    } else {
      permissions = this.hardcodedPermissions.employee;
    }
    
    console.log(`[DEV] Using hardcoded permissions for role: ${roleId}`, permissions);
    this.userPermissionsSubject.next(permissions);
  }
  
  private fetchRolePermissions(roleId: string): Observable<string[]> {
    // Fetch permissions from the server
    return this.http.get<Role>(`/api/v1/roles/${roleId}`).pipe(
      map(role => role.permissions || []),
      catchError(error => {
        console.error('Failed to fetch role permissions', error);
        
        // Fall back to hardcoded permissions in case of error
        if (this.useHardcodedPermissions) {
          let fallbackPermissions: string[] = [];
          
          if (roleId.toLowerCase().includes('admin')) {
            fallbackPermissions = this.hardcodedPermissions.admin;
          } else if (roleId.toLowerCase().includes('manager')) {
            fallbackPermissions = this.hardcodedPermissions.manager;
          } else {
            fallbackPermissions = this.hardcodedPermissions.employee;
          }
          
          console.warn('[DEV] Falling back to hardcoded permissions due to API error');
          return of(fallbackPermissions);
        }
        
        return of([]);
      }),
      tap(permissions => {
        console.log('Fetched permissions:', permissions);
      })
    );
  }
  
  /**
   * Check if the user has a specific permission
   */
  hasPermission(permission: string): boolean {
    const permissions = this.userPermissionsSubject.value;
    return permissions.includes(permission);
  }
  
  /**
   * Check if the user has at least one of the specified permissions
   */
  hasAnyPermission(permissions: string[]): boolean {
    return permissions.some(permission => this.hasPermission(permission));
  }
  
  /**
   * Check if the user has all of the specified permissions
   */
  hasAllPermissions(permissions: string[]): boolean {
    return permissions.every(permission => this.hasPermission(permission));
  }
  
  /**
   * Check if the user can perform a specific action on a resource
   */
  canPerform(resource: string, action: string): boolean {
    const permission = `${resource}:${action}`;
    return this.hasPermission(permission);
  }
  
  /**
   * Get all permissions for a specific resource
   */
  getResourcePermissions(resource: string): string[] {
    const permissions = this.userPermissionsSubject.value;
    return permissions.filter(p => p.startsWith(`${resource}:`));
  }
  
  /**
   * Check if the user has any permissions for a resource
   */
  hasResourceAccess(resource: string): boolean {
    const resourcePermissions = this.getResourcePermissions(resource);
    return resourcePermissions.length > 0;
  }
  
  /**
   * Get all resources the user has access to
   */
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
  
  /**
   * Get role-based identifier for the current user
   */
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
  
  /**
   * Helper method to determine if the user is an admin
   */
  isAdmin(): boolean {
    return this.getRoleIdentifier() === 'admin';
  }
  
  /**
   * Helper method to determine if the user is a manager
   */
  isManager(): boolean {
    return this.getRoleIdentifier() === 'manager';
  }
  
  /**
   * Helper method to determine if the user is an employee
   */
  isEmployee(): boolean {
    return this.getRoleIdentifier() === 'employee';
  }
}