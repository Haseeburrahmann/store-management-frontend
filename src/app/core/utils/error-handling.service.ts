// src/app/core/utils/error-handling.service.ts
import { Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ErrorHandlingService {
  /**
   * Process HTTP errors and return user-friendly messages
   */
  public static getErrorMessage(error: HttpErrorResponse): string {
    // Check for specific status codes
    switch (error.status) {
      case 400:
        // Try to extract detailed validation errors
        if (error.error?.detail) {
          return `Validation error: ${error.error.detail}`;
        }
        return 'Invalid request. Please check your input and try again.';
      
      case 401:
        return 'You are not authenticated. Please log in again.';
      
      case 403:
        return 'You do not have permission to perform this action.';
      
      case 404:
        return 'The requested resource was not found.';
      
      case 409:
        return 'There was a conflict with your request. The data may have been modified.';
      
      case 422:
        return 'The server could not process your request. Please check your input.';
      
      case 500:
        return 'An internal server error occurred. Please try again later.';
      
      case 503:
        return 'The service is temporarily unavailable. Please try again later.';
      
      case 0:
        return 'Could not connect to the server. Please check your network connection.';
      
      default:
        return error.message || 'An unknown error occurred. Please try again.';
    }
  }

  /**
   * Generic error handler for HTTP operations
   * @param operation - Name of the operation that failed
   * @param result - Optional value to return as the observable result
   */
  public static handleError<T>(operation = 'operation', result?: T) {
    return (error: HttpErrorResponse): Observable<T> => {
      const errorMessage = this.getErrorMessage(error);
      console.error(`${operation} failed: ${errorMessage}`, error);
      
      // Return an empty result to keep the application running
      return of(result as T);
    };
  }

  /**
   * Extract validation errors from the response
   */
  public static getValidationErrors(error: HttpErrorResponse): Record<string, string> {
    const errors: Record<string, string> = {};
    
    if (error.status === 400 && error.error) {
      // Handle various error formats from the backend
      if (error.error.detail && typeof error.error.detail === 'string') {
        errors['_general'] = error.error.detail;
      } 
      else if (error.error.detail && Array.isArray(error.error.detail)) {
        // Handle FastAPI validation error format
        error.error.detail.forEach((err: any) => {
          if (err.loc && err.loc.length > 1) {
            const field = err.loc[1];
            errors[field] = err.msg;
          }
        });
      }
      else if (typeof error.error === 'object') {
        // Handle object with field-specific errors
        Object.keys(error.error).forEach(key => {
          const value = error.error[key];
          errors[key] = Array.isArray(value) ? value[0] : value;
        });
      }
    }
    
    return errors;
  }
}