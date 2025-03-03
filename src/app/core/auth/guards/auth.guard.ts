import { Injectable } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  
  constructor(private authService: AuthService, private router: Router) { }
  
  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    if (this.authService.isAuthenticated()) {
      // Check for required permissions if specified
      const requiredPermission = route.data['permission'] as string;
      
      if (requiredPermission && !this.authService.hasPermission(requiredPermission)) {
        this.router.navigate(['/dashboard']);
        return false;
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