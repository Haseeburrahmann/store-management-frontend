// src/app/core/utils/error-handler.ts

import { HttpErrorResponse } from '@angular/common/http';
import { throwError, Observable } from 'rxjs';

/**
 * Standard error types used throughout the application
 */
export enum ErrorType {
  VALIDATION = 'validation',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  NOT_FOUND = 'not_found',
  SERVER = 'server',
  NETWORK = 'network',
  UNKNOWN = 'unknown',
}

/**
 * Standardized error structure for the application
 */
export interface AppError {
  type: ErrorType;
  message: string;
  originalError?: any;
  validationErrors?: { [field: string]: string };
}

/**
 * Creates a standardized application error from any source error
 * 
 * @param error The source error (HTTP error, string, Error object, etc.)
 * @returns A standardized AppError object
 */
export function createAppError(error: any): AppError {
  // Create a base error with unknown type
  const appError: AppError = {
    type: ErrorType.UNKNOWN,
    message: 'An unknown error occurred'
  };
  
  // Store the original error for debugging
  appError.originalError = error;
  
  // Handle different error types
  if (error instanceof HttpErrorResponse) {
    return handleHttpError(error);
  } else if (error instanceof Error) {
    appError.message = error.message;
  } else if (typeof error === 'string') {
    appError.message = error;
  } else if (typeof error === 'object' && error !== null) {
    if (error.message) {
      appError.message = error.message;
    } else {
      try {
        appError.message = JSON.stringify(error);
      } catch (e) {
        appError.message = 'Error object could not be stringified';
      }
    }
  }
  
  return appError;
}

/**
 * Handles HTTP error responses and converts them to AppError format
 * 
 * @param error The HTTP error response
 * @returns A standardized AppError object
 */
function handleHttpError(error: HttpErrorResponse): AppError {
  const appError: AppError = {
    type: ErrorType.UNKNOWN,
    message: 'An error occurred while communicating with the server',
    originalError: error
  };
  
  // Handle client-side network errors
  if (error.error instanceof ErrorEvent) {
    appError.type = ErrorType.NETWORK;
    appError.message = 'Network error: ' + error.error.message;
    return appError;
  }
  
  // Handle server-side errors based on status code
  switch (error.status) {
    case 0:
      appError.type = ErrorType.NETWORK;
      appError.message = 'Cannot connect to the server. Please check your internet connection.';
      break;
      
    case 400:
      appError.type = ErrorType.VALIDATION;
      appError.message = 'The request was invalid.';
      
      // Handle validation errors
      if (error.error) {
        if (typeof error.error === 'object') {
          if (error.error.detail) {
            appError.message = error.error.detail;
          } else {
            // Extract validation errors from response
            const validationErrors: { [field: string]: string } = {};
            for (const key in error.error) {
              if (error.error.hasOwnProperty(key)) {
                const value = error.error[key];
                if (Array.isArray(value)) {
                  validationErrors[key] = value.join(', ');
                } else if (typeof value === 'string') {
                  validationErrors[key] = value;
                }
              }
            }
            
            if (Object.keys(validationErrors).length > 0) {
              appError.validationErrors = validationErrors;
              appError.message = 'Validation error: Please check the form for errors.';
            }
          }
        } else if (typeof error.error === 'string' && error.error.trim()) {
          appError.message = error.error;
        }
      }
      break;
      
    case 401:
      appError.type = ErrorType.AUTHENTICATION;
      appError.message = 'Authentication required. Please log in.';
      break;
      
    case 403:
      appError.type = ErrorType.AUTHORIZATION;
      appError.message = 'You do not have permission to perform this action.';
      break;
      
    case 404:
      appError.type = ErrorType.NOT_FOUND;
      appError.message = 'Resource not found.';
      break;
      
    case 422:
      appError.type = ErrorType.VALIDATION;
      appError.message = 'The data provided was invalid.';
      
      // Handle FastAPI validation errors
      if (error.error && error.error.detail) {
        if (Array.isArray(error.error.detail)) {
          const validationErrors: { [field: string]: string } = {};
          
          error.error.detail.forEach((item: any) => {
            if (item.loc && Array.isArray(item.loc) && item.loc.length > 1) {
              const field = item.loc[item.loc.length - 1];
              validationErrors[field] = item.msg;
            }
          });
          
          if (Object.keys(validationErrors).length > 0) {
            appError.validationErrors = validationErrors;
            appError.message = 'Validation error: Please check the form for errors.';
          }
        } else if (typeof error.error.detail === 'string') {
          appError.message = error.error.detail;
        }
      }
      break;
      
    case 500:
    case 502:
    case 503:
    case 504:
      appError.type = ErrorType.SERVER;
      appError.message = 'Server error. Please try again later.';
      break;
      
    default:
      appError.message = `Error ${error.status}: ${error.statusText || 'Unknown error'}`;
  }
  
  return appError;
}

import { catchError as rxjsCatchError } from 'rxjs/operators';

/**
 * RxJS operator to handle and standardize errors in observables
 * 
 * @returns An observable operator that transforms errors to AppError and wraps in throwError
 */
export function handleError<T>() {
  return rxjsCatchError((error: any) => {
    const appError = createAppError(error);
    return throwError(() => appError);
  });
}

/**
 * Helper to standardize error handling in RxJS
 * 
 * @param error The error to process
 * @returns Observable that emits the standardized error
 */
export function handleApiError(error: any): Observable<never> {
  const appError = createAppError(error);
  return throwError(() => appError);
}

/**
 * Gets a user-friendly message for display based on an AppError
 * 
 * @param error The AppError object
 * @returns A user-friendly message string
 */
export function getUserErrorMessage(error: AppError): string {
  return error.message;
}

/**
 * Gets a technical error message for logging
 * 
 * @param error The AppError object
 * @returns A detailed technical message for logs
 */
export function getTechnicalErrorMessage(error: AppError): string {
  let message = `[${error.type}] ${error.message}`;
  
  if (error.originalError) {
    if (error.originalError instanceof HttpErrorResponse) {
      message += ` (Status: ${error.originalError.status})`;
    }
    
    // Add stack trace if available
    if (error.originalError.stack) {
      message += `\nStack: ${error.originalError.stack}`;
    }
  }
  
  return message;
}