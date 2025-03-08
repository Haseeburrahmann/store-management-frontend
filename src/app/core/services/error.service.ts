import { Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { NotificationService } from './notification.service';

@Injectable({
  providedIn: 'root'
})
export class ErrorService {
  constructor(private notificationService: NotificationService) {}

  /**
   * Process HTTP errors and provide consistent error handling
   */
  handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Unknown error occurred';
    
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side error
      if (error.status === 0) {
        errorMessage = 'Server is unreachable. Please check your internet connection.';
      } else if (error.status === 401) {
        errorMessage = 'Unauthorized. Please log in again.';
      } else if (error.status === 403) {
        errorMessage = 'You do not have permission to perform this action.';
      } else if (error.status === 404) {
        errorMessage = 'Resource not found.';
      } else if (error.status === 422) {
        // Specifically handle validation errors from FastAPI
        if (error.error && error.error.detail) {
          if (Array.isArray(error.error.detail)) {
            // Handle multiple validation errors
            errorMessage = error.error.detail.map((item: any) => item.msg).join(', ');
          } else {
            // Handle single error message
            errorMessage = error.error.detail;
          }
        } else {
          errorMessage = 'Validation error. Please check your input.';
        }
      } else if (error.status >= 500) {
        errorMessage = 'Server error. Please try again later.';
      } else if (error.error?.detail) {
        errorMessage = error.error.detail;
      } else {
        errorMessage = `Error ${error.status}: ${error.statusText}`;
      }
    }
    
    // Show notification for the error
    this.notificationService.error(errorMessage);
    
    // Log error to console in development
    console.error('API Error:', error);
    
    // Return an observable error
    return throwError(() => new Error(errorMessage));
  }

  /**
   * Log errors to a monitoring service (like Sentry)
   * This would be implemented in a production environment
   */
  logError(error: any): void {
    // Integration with error monitoring service would go here
    console.error('Error logged:', error);
  }
}