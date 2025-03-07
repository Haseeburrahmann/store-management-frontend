// src/app/core/interceptors/error.interceptor.ts

import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse,
  HttpContextToken
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { NotificationService } from '../services/notification.service';

/**
 * HTTP context token to control notification display for errors
 */
export const SHOW_ERROR_NOTIFICATION = new HttpContextToken<boolean>(() => true);

/**
 * HTTP context token to control auto logout on 401 errors
 */
export const AUTO_LOGOUT_ON_UNAUTHORIZED = new HttpContextToken<boolean>(() => true);

/**
 * HTTP interceptor for centralized error handling
 */
@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  private activeRequests = 0;
  private commonSuppressedErrors = [
    'Failed to fetch',
    'Network request failed',
    'Network Error',
    'The user aborted a request'
  ];

  constructor(
    private authService: AuthService,
    private router: Router,
    private notificationService: NotificationService
  ) {}

  /**
   * Intercepts HTTP requests and handles errors
   * 
   * @param request The HTTP request
   * @param next The next HTTP handler
   * @returns An Observable of the HTTP event
   */
  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    this.activeRequests++;
    
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        return this.handleError(error, request);
      }),
      finalize(() => {
        this.activeRequests--;
      })
    );
  }

  /**
   * Handles HTTP errors
   * 
   * @param error The HTTP error response
   * @param request The original HTTP request
   * @returns An Observable that errors with the handled error
   */
  private handleError(error: HttpErrorResponse, request: HttpRequest<unknown>): Observable<never> {
    // Don't show notifications for canceled requests
    if (error.name === 'HttpErrorResponse' && error.error instanceof ProgressEvent && error.error.type === 'abort') {
      return throwError(() => error);
    }
    
    // Handle authentication errors
    if (error.status === 401) {
      if (request.context.get(AUTO_LOGOUT_ON_UNAUTHORIZED)) {
        // Only logout if not already on the login page to prevent infinite loops
        const currentUrl = this.router.url;
        if (!currentUrl.startsWith('/login')) {
          this.authService.logout();
          
          if (request.context.get(SHOW_ERROR_NOTIFICATION)) {
            this.notificationService.warning('Your session has expired. Please log in again.');
          }
        }
      }
    }
    
    // Handle forbidden errors
    if (error.status === 403) {
      this.router.navigate(['/forbidden']);
      
      if (request.context.get(SHOW_ERROR_NOTIFICATION)) {
        this.notificationService.error('You do not have permission to access this resource.');
      }
    }
    
    // Handle server errors
    if (error.status >= 500) {
      if (request.context.get(SHOW_ERROR_NOTIFICATION)) {
        this.notificationService.error('Server error. Please try again later or contact support.');
      }
    }
    
    // Handle client-side network errors
    if (error.status === 0) {
      const errorMessage = error.message || 'Network error';
      
      // Only show notification for network errors that are not in the suppressed list
      if (request.context.get(SHOW_ERROR_NOTIFICATION) && 
          !this.commonSuppressedErrors.some(msg => errorMessage.includes(msg))) {
        this.notificationService.error('Network error. Please check your internet connection.');
      }
    }
    
    // Handle validation errors
    if (error.status === 422) {
      if (request.context.get(SHOW_ERROR_NOTIFICATION)) {
        let errorMessage = 'Validation error';
        
        // Try to extract a meaningful error message from the response
        if (error.error && typeof error.error === 'object') {
          if (error.error.message) {
            errorMessage = error.error.message;
          } else if (error.error.errors) {
            const errors = error.error.errors;
            if (Array.isArray(errors) && errors.length > 0) {
              errorMessage = errors[0];
            } else if (typeof errors === 'object') {
              const firstErrorKey = Object.keys(errors)[0];
              if (firstErrorKey && Array.isArray(errors[firstErrorKey]) && errors[firstErrorKey].length > 0) {
                errorMessage = errors[firstErrorKey][0];
              }
            }
          }
        }
        
        this.notificationService.error(errorMessage);
      }
    }
    
    // Log errors in development mode
    if (!this.isProdMode()) {
      console.error('HTTP Error:', error);
    }
    
    // Rethrow the error for further handling
    return throwError(() => error);
  }

  /**
   * Checks if the application is running in production mode
   * 
   * @returns True if in production mode
   */
  private isProdMode(): boolean {
    return false; // Replace with actual environment check
  }
}