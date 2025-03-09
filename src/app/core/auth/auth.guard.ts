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
    
    // First check if user is authenticated
    if (!this.authService.isAuthenticated) {
      // Redirect to login page with return url
      return this.router.createUrlTree(['/auth/login'], {
        queryParams: { returnUrl: state.url }
      });
    }
    
    // Check for required permission if specified in route data
    const requiredPermission = route.data['requiredPermission'] as string;
    
    if (requiredPermission && !this.permissionService.hasPermission(requiredPermission)) {
      console.warn(`Permission denied: ${requiredPermission} is required to access ${state.url}`);
      
      // Redirect to dashboard or show access denied page
      return this.router.createUrlTree(['/dashboard']);
    }
    
    // Check for required permissions (array) if specified in route data
    const requiredPermissions = route.data['requiredPermissions'] as string[];
    
    if (requiredPermissions && requiredPermissions.length > 0) {
      const hasRequiredPermissions = this.permissionService.hasAllPermissions(requiredPermissions);
      
      if (!hasRequiredPermissions) {
        console.warn(`Permission denied: One or more required permissions missing for ${state.url}`);
        
        // Redirect to dashboard or show access denied page
        return this.router.createUrlTree(['/dashboard']);
      }
    }
    
    // Check for any required permissions if specified in route data
    const anyRequiredPermissions = route.data['anyRequiredPermissions'] as string[];
    
    if (anyRequiredPermissions && anyRequiredPermissions.length > 0) {
      const hasAnyRequiredPermission = this.permissionService.hasAnyPermission(anyRequiredPermissions);
      
      if (!hasAnyRequiredPermission) {
        console.warn(`Permission denied: At least one permission from ${anyRequiredPermissions.join(', ')} is required to access ${state.url}`);
        
        // Redirect to dashboard or show access denied page
        return this.router.createUrlTree(['/dashboard']);
      }
    }
    
    // All checks passed
    return true;
  }
  
  /**
   * Helper method to check if user has specific permission
   * Can be used from components to secure UI elements
   */
  hasPermission(permission: string): boolean {
    return this.permissionService.hasPermission(permission);
  }
}