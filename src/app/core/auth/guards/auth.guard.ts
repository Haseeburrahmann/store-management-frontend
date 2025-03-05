// src/app/core/auth/guards/auth.guard.ts

import { Injectable } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  
  constructor(private authService: AuthService, private router: Router) { }
  
  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    if (this.authService.isAuthenticated()) {
      // Check for required permissions if specified
      const requiredPermission = route.data['permission'] as string;
      
      if (requiredPermission) {
        // If permission is in format "area:action"
        if (requiredPermission.includes(':') && !requiredPermission.includes('PermissionArea')) {
          const [area, action] = requiredPermission.split(':');
          if (!this.authService.hasPermission(area, action)) {
            console.warn(`Access denied: Missing permission ${requiredPermission}`);
            this.router.navigate(['/dashboard']);
            return false;
          }
        } 
        // If permission is in enum format or legacy format
        else {
          // Use the legacy method for backward compatibility
          if (!this.authService.hasPermissionLegacy(requiredPermission)) {
            console.warn(`Access denied: Missing permission ${requiredPermission}`);
            this.router.navigate(['/dashboard']);
            return false;
          }
        }
      }
      
      return true;
    }
    
    // Not logged in, redirect to login page
    this.router.navigate(['/login'], { 
      queryParams: { returnUrl: state.url }
    });
    return false;
  }
}