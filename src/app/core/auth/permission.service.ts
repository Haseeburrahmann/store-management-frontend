// src/app/core/auth/permission.service.ts
import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, filter, map, tap } from 'rxjs/operators';
import { Role } from '../../shared/models/role.model';

@Injectable({
  providedIn: 'root'
})
export class PermissionService {
  public userPermissionsSubject = new BehaviorSubject<string[]>([]);
  public userPermissions$ = this.userPermissionsSubject.asObservable();
  
  constructor(
    private authService: AuthService,
    private http: HttpClient
  ) {
    //console.log('Permission Service: Initializing');
    
    // Initialize permissions from current user if available
    this.initPermissions();
    
    // Subscribe to user changes to update permissions
    this.authService.currentUser$.pipe(
      tap(user => {
        //console.log('Permission Service: User changed', user?.email);
      }),
      filter(user => !!user)
    ).subscribe(user => {
      //console.log('Permission Service: User has role_id', user?.role_id);
      // Use permissions directly from the user object if available
      if (user?.permissions) {
       // console.log('Permission Service: Using permissions from user object', user.permissions);
        this.userPermissionsSubject.next(user.permissions);
      } else {
        //console.log('Permission Service: No permissions in user object');
        this.userPermissionsSubject.next([]);
      }
    });
  }
  
  private initPermissions(): void {
    //console.log('Permission Service: Initializing permissions');
    const user = this.authService.currentUser;
    if (user) {
      //console.log('Permission Service: User found in storage with role_id', user.role_id);
      if (user.permissions) {
       // console.log('Permission Service: Using permissions from storage', user.permissions);
        this.userPermissionsSubject.next(user.permissions);
      } else {
        //console.log('Permission Service: No permissions found in stored user data');
      }
    } else {
      //console.log('Permission Service: No user found in storage');
    }
  }
  
  /**
   * Check if the user has a specific permission
   */
  hasPermission(permission: string): boolean {
    const permissions = this.userPermissionsSubject.value;
    const hasPermission = permissions.includes(permission);
    //console.log(`Permission check: "${permission}" - ${hasPermission ? 'Granted' : 'Denied'}`);
    return hasPermission;
  }
  
  /**
   * Check if the user has at least one of the specified permissions
   */
  hasAnyPermission(permissions: string[]): boolean {
    const result = permissions.some(permission => this.hasPermission(permission));
    //console.log(`Permission check (any): [${permissions.join(', ')}] - ${result ? 'Granted' : 'Denied'}`);
    return result;
  }
  
  /**
   * Check if the user has all of the specified permissions
   */
  hasAllPermissions(permissions: string[]): boolean {
    const result = permissions.every(permission => this.hasPermission(permission));
    //console.log(`Permission check (all): [${permissions.join(', ')}] - ${result ? 'Granted' : 'Denied'}`);
    return result;
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
    //console.log('Getting role identifier for user:', user?.email, 'with role ID:', user?.role_id);
    
    if (!user) {
      //console.log('No user found, returning unknown role');
      return 'unknown';
    }
    
    // Check role ID directly (more reliable than permission checks)
    if (user.role_id === '67c9fb4d9db05f47c32b6b22') {
      //console.log('Admin role ID detected');
      return 'admin';
    }
    
    if (user.role_id === '67c9fb4d9db05f47c32b6b23') {
      //console.log('Manager role ID detected');
      return 'manager';
    }
    
    if (user.role_id === '67c9fb4d9db05f47c32b6b24') {
      //console.log('Employee role ID detected');
      return 'employee';
    }
    
    // Fallback to permission-based detection
    //console.log('Using permission-based role detection');
    
    // Check for admin permissions
    if (this.hasPermission('users:delete') && this.hasPermission('roles:write')) {
      //console.log('Admin permissions detected');
      return 'admin';
    }
    
    // Check for manager permissions
    if (this.hasPermission('employees:approve') && this.hasPermission('hours:approve')) {
      //console.log('Manager permissions detected');
      return 'manager';
    }
    
    // Default to employee if they have basic permissions
    if (this.hasPermission('hours:read')) {
      //console.log('Employee permissions detected');
      return 'employee';
    }
    
    //console.log('No matching role pattern found, returning unknown');
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