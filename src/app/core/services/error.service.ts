// src/app/core/services/error.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AppError, ErrorType } from '../utils/error-handler';

export interface ErrorLogEntry {
  timestamp: string;
  type: ErrorType;
  message: string;
  stack?: string;
  context?: any;
  url?: string;
  userId?: string | null;
}

/**
 * Maximum number of error logs to keep in memory
 */
const MAX_ERROR_LOG_SIZE = 50;

/**
 * Service for centralized error logging and tracking
 */
@Injectable({
  providedIn: 'root'
})
export class ErrorService {
  private errorLogs = new BehaviorSubject<ErrorLogEntry[]>([]);
  private errorCount = new BehaviorSubject<number>(0);
  private errorLogsLocalStorageKey = 'app_error_logs';

  constructor(private http: HttpClient) {
    this.loadErrorLogsFromStorage();
  }

  /**
   * Gets the error logs as an observable
   * 
   * @returns Observable of error logs
   */
  getErrorLogs(): Observable<ErrorLogEntry[]> {
    return this.errorLogs.asObservable();
  }

  /**
   * Gets the error count as an observable
   * 
   * @returns Observable of error count
   */
  getErrorCount(): Observable<number> {
    return this.errorCount.asObservable();
  }

  /**
   * Logs an error
   * 
   * @param error Error to log
   * @param context Additional context
   */
  logError(error: Error | AppError, context?: any): void {
    const timestamp = new Date().toISOString();
    let type = ErrorType.UNKNOWN;
    let message = error.message || 'Unknown error';
    let stack = error instanceof Error ? error.stack : undefined;

    // If it's an AppError, extract more information
    if ('type' in error) {
      type = error.type;
      
      // Use validationErrors if available
      if ('validationErrors' in error && error.validationErrors) {
        if (typeof error.validationErrors === 'string') {
          message = error.validationErrors;
        } else if (typeof error.validationErrors === 'object') {
          // Flatten validation errors object
          message = this.flattenValidationErrors(error.validationErrors);
        }
      }
    }

    const errorEntry: ErrorLogEntry = {
      timestamp,
      type,
      message,
      stack,
      context,
      url: window.location.href,
      userId: this.getCurrentUserId()
    };

    this.addErrorLog(errorEntry);
    this.incrementErrorCount();

    // In production, send error to server
    if (environment.production) {
      this.sendErrorToServer(errorEntry);
    } else {
      console.error('Error logged:', errorEntry);
    }
  }

  /**
   * Clears all error logs
   */
  clearErrorLogs(): void {
    this.errorLogs.next([]);
    this.errorCount.next(0);
    localStorage.removeItem(this.errorLogsLocalStorageKey);
  }

  /**
   * Adds an error log to the in-memory list and localStorage
   * 
   * @param errorEntry Error log entry
   */
  private addErrorLog(errorEntry: ErrorLogEntry): void {
    const currentLogs = this.errorLogs.value;
    
    // Add new log at the beginning (newest first)
    const updatedLogs = [errorEntry, ...currentLogs];
    
    // Limit the number of logs
    const trimmedLogs = updatedLogs.slice(0, MAX_ERROR_LOG_SIZE);
    
    this.errorLogs.next(trimmedLogs);
    this.saveErrorLogsToStorage(trimmedLogs);
  }

  /**
   * Increments the error count
   */
  private incrementErrorCount(): void {
    const currentCount = this.errorCount.value;
    this.errorCount.next(currentCount + 1);
  }

  /**
   * Saves error logs to localStorage
   * 
   * @param logs Error logs to save
   */
  private saveErrorLogsToStorage(logs: ErrorLogEntry[]): void {
    try {
      // Remove stack traces to save space
      const logsForStorage = logs.map(log => ({
        ...log,
        stack: undefined
      }));
      
      localStorage.setItem(this.errorLogsLocalStorageKey, JSON.stringify(logsForStorage));
    } catch (error) {
      console.error('Error saving error logs to localStorage:', error);
    }
  }

  /**
   * Loads error logs from localStorage
   */
  private loadErrorLogsFromStorage(): void {
    try {
      const logsJson = localStorage.getItem(this.errorLogsLocalStorageKey);
      
      if (logsJson) {
        const logs = JSON.parse(logsJson) as ErrorLogEntry[];
        this.errorLogs.next(logs);
        this.errorCount.next(logs.length);
      }
    } catch (error) {
      console.error('Error loading error logs from localStorage:', error);
    }
  }

  /**
   * Sends an error log to the server
   * 
   * @param errorEntry Error log entry
   */
  private sendErrorToServer(errorEntry: ErrorLogEntry): void {
    // Skip sending if no API URL is available
    if (!environment.apiUrl) {
      return;
    }
    
    const errorLogEndpoint = `${environment.apiUrl}/error-logs`;
    
    // Remove sensitive information before sending
    const sanitizedEntry = {
      ...errorEntry,
      context: this.sanitizeContext(errorEntry.context)
    };
    
    this.http.post(errorLogEndpoint, sanitizedEntry).subscribe({
      next: () => {
        // Error logged successfully
      },
      error: (error) => {
        // Failed to log error to server, log locally
        console.error('Failed to send error log to server:', error);
      }
    });
  }

  /**
   * Gets the current user ID if available
   * 
   * @returns User ID or null
   */
  private getCurrentUserId(): string | null {
    // Get user ID from wherever it's stored in your application
    // This is just an example, implement according to your auth system
    try {
      const userJson = localStorage.getItem('user');
      if (userJson) {
        const user = JSON.parse(userJson);
        return user.id || null;
      }
    } catch (error) {
      // Ignore errors
    }
    
    return null;
  }

  /**
   * Sanitizes error context to remove sensitive information
   * 
   * @param context Error context
   * @returns Sanitized context
   */
  private sanitizeContext(context: any): any {
    if (!context) {
      return context;
    }
    
    // Create a copy to avoid modifying the original
    const sanitized = { ...context };
    
    // List of sensitive keys to remove
    const sensitiveKeys = [
      'password',
      'token',
      'secret',
      'key',
      'authorization',
      'creditCard',
      'ssn',
      'social',
      'auth'
    ];
    
    // Recursively sanitize objects
    const sanitizeObj = (obj: any): any => {
      if (!obj || typeof obj !== 'object') {
        return obj;
      }
      
      Object.keys(obj).forEach(key => {
        const lowerKey = key.toLowerCase();
        
        // Check if the key contains any sensitive key
        if (sensitiveKeys.some(sk => lowerKey.includes(sk))) {
          obj[key] = '[REDACTED]';
        } else if (typeof obj[key] === 'object') {
          obj[key] = sanitizeObj(obj[key]);
        }
      });
      
      return obj;
    };
    
    return sanitizeObj(sanitized);
  }

  /**
   * Flattens validation errors into a readable message
   * 
   * @param errors Validation errors object
   * @returns Flattened error message
   */
  private flattenValidationErrors(errors: any): string {
    if (typeof errors === 'string') {
      return errors;
    }
    
    if (Array.isArray(errors)) {
      return errors.join(', ');
    }
    
    if (typeof errors === 'object') {
      return Object.entries(errors)
        .map(([field, messages]) => {
          if (Array.isArray(messages)) {
            return `${field}: ${messages.join(', ')}`;
          }
          return `${field}: ${messages}`;
        })
        .join('; ');
    }
    
    return 'Validation error';
  }
}