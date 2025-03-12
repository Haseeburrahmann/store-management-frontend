import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { IdValidationService } from '../utils/id-validation.service';

@Injectable({
  providedIn: 'root'
})
export class IdValidationGuard implements CanActivate {
  constructor(
    private router: Router,
    private idValidationService: IdValidationService
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    // Get the ID parameter name from route data or default to 'id'
    const idParam = route.data['idParam'] || 'id';
    const idType = route.data['idType'] || 'unknown';
    
    // Get the ID from route params
    const id = route.paramMap.get(idParam);
    
    // Log ID details for debugging
    this.idValidationService.logIdInfo(id, `IdValidationGuard for ${idType}`);
    
    // Validate ID format
    if (!id || !this.idValidationService.isValidObjectId(id)) {
      console.error(`Invalid ${idType} ID format: ${id}`);
      
      // Navigate to appropriate error page or list page
      if (idType === 'schedule') {
        this.router.navigate(['/schedules']);
      } else {
        this.router.navigate(['/']);
      }
      
      return of(false);
    }
    
    // Check for shift IDs when expecting schedule IDs
    if (idType === 'schedule' && this.isLikelyShiftId(id)) {
      console.error(`ID appears to be a shift ID, not a schedule ID: ${id}`);
      this.router.navigate(['/schedules']);
      return of(false);
    }
    
    return of(true);
  }

  /**
   * Check if an ID looks like a shift ID based on patterns in your MongoDB data
   */
  private isLikelyShiftId(id: string): boolean {
    // Based on your data, shift IDs contain "bc" in them
    return id.includes('bc');
  }
}