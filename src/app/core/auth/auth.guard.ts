// src/app/core/auth/auth.guard.ts
import { Injectable } from '@angular/core';
import { 
  CanActivate, 
  ActivatedRouteSnapshot, 
  RouterStateSnapshot, 
  UrlTree, 
  Router 
} from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { PermissionService } from './permission.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService, 
    private permissionService: PermissionService,
    private router: Router
  ) {}
  
  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    console.log('Auth Guard: Checking authentication for', state.url);
    
    // First check if user is authenticated
    if (!this.authService.isAuthenticated) {
      console.log('Auth Guard: User is not authenticated, redirecting to login');
      // Redirect to login page with return url
      return this.router.createUrlTree(['/auth/login'], {
        queryParams: { returnUrl: state.url }
      });
    }
    
    console.log('Auth Guard: User is authenticated, checking permissions');
    
    // Check for required permission if specified in route data
    const requiredPermission = route.data['requiredPermission'] as string;
    
    if (requiredPermission) {
      console.log(`Auth Guard: Checking required permission: ${requiredPermission}`);
      
      if (!this.permissionService.hasPermission(requiredPermission)) {
        console.warn(`Auth Guard: Permission denied: ${requiredPermission} is required to access ${state.url}`);
        
        // Redirect to dashboard or show access denied page
        return this.router.createUrlTree(['/dashboard']);
      }
      
      console.log(`Auth Guard: Permission ${requiredPermission} granted`);
    }
    
    // Check for required permissions (array) if specified in route data
    const requiredPermissions = route.data['requiredPermissions'] as string[];
    
    if (requiredPermissions && requiredPermissions.length > 0) {
      console.log(`Auth Guard: Checking required permissions: ${requiredPermissions.join(', ')}`);
      
      const hasRequiredPermissions = this.permissionService.hasAllPermissions(requiredPermissions);
      
      if (!hasRequiredPermissions) {
        console.warn(`Auth Guard: Permission denied: One or more required permissions missing for ${state.url}`);
        
        // Redirect to dashboard or show access denied page
        return this.router.createUrlTree(['/dashboard']);
      }
      
      console.log('Auth Guard: All required permissions granted');
    }
    
    // Check for any required permissions if specified in route data
    const anyRequiredPermissions = route.data['anyRequiredPermissions'] as string[];
    
    if (anyRequiredPermissions && anyRequiredPermissions.length > 0) {
      console.log(`Auth Guard: Checking any required permissions: ${anyRequiredPermissions.join(', ')}`);
      
      const hasAnyRequiredPermission = this.permissionService.hasAnyPermission(anyRequiredPermissions);
      
      if (!hasAnyRequiredPermission) {
        console.warn(`Auth Guard: Permission denied: At least one permission from ${anyRequiredPermissions.join(', ')} is required to access ${state.url}`);
        
        // Redirect to dashboard or show access denied page
        return this.router.createUrlTree(['/dashboard']);
      }
      
      console.log('Auth Guard: At least one required permission granted');
    }
    
    // All checks passed
    console.log('Auth Guard: All authentication and permission checks passed for', state.url);
    return true;
  }
  
  /**
   * Helper method to check if user has specific permission
   * Can be used from components to secure UI elements
   */
  hasPermission(permission: string): boolean {
    const result = this.permissionService.hasPermission(permission);
    console.log(`Auth Guard permission check: ${permission} - ${result ? 'Granted' : 'Denied'}`);
    return result;
  }
}