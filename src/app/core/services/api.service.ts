// src/app/core/services/api.service.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, retry, timeout } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { createAppError, AppError, ErrorType } from '../utils/error-handler';

export interface ApiRequestOptions {
  headers?: HttpHeaders | { [header: string]: string | string[] };
  params?: HttpParams | { [param: string]: string | string[] };
  reportProgress?: boolean;
  responseType?: 'json' | 'text' | 'blob' | 'arraybuffer';
  withCredentials?: boolean;
  body?: any;
  retries?: number;
  timeoutMs?: number;
  skipErrorHandling?: boolean;
  context?: any;
}

export interface ApiResponse<T> {
  data: T;
  meta?: {
    pagination?: {
      total: number;
      page: number;
      pageSize: number;
      totalPages: number;
    };
  };
}

/**
 * Enhanced API Service with standardized error handling,
 * request retries, and response transformation
 */
@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiBaseUrl = environment.apiUrl;
  private defaultTimeout = 30000; // 30 seconds
  private defaultRetries = 1;

  constructor(private http: HttpClient) {}

  /**
   * Performs a GET request
   * 
   * @param endpoint API endpoint
   * @param options Request options
   * @returns Observable of the response
   */
  get<T>(endpoint: string, options: ApiRequestOptions = {}): Observable<T> {
    const url = this.buildUrl(endpoint);
    
    return this.http.get<T>(url, {
      headers: options.headers as HttpHeaders,
      params: options.params as HttpParams,
      reportProgress: options.reportProgress,
      responseType: options.responseType as any,
      withCredentials: options.withCredentials,
      context: options.context
    }).pipe(
      timeout(options.timeoutMs || this.defaultTimeout),
      retry({
        count: options.retries ?? this.defaultRetries,
        delay: this.retryStrategy
      }),
      catchError(error => this.handleError<T>(error, options.skipErrorHandling))
    );
  }

  /**
   * Performs a POST request
   * 
   * @param endpoint API endpoint
   * @param body Request body
   * @param options Request options
   * @returns Observable of the response
   */
  post<T>(endpoint: string, body: any, options: ApiRequestOptions = {}): Observable<T> {
    const url = this.buildUrl(endpoint);
    
    return this.http.post<T>(url, body, {
      headers: options.headers as HttpHeaders,
      params: options.params as HttpParams,
      reportProgress: options.reportProgress,
      responseType: options.responseType as any,
      withCredentials: options.withCredentials,
      context: options.context
    }).pipe(
      timeout(options.timeoutMs || this.defaultTimeout),
      retry({
        count: options.retries ?? this.defaultRetries,
        delay: this.retryStrategy
      }),
      catchError(error => this.handleError<T>(error, options.skipErrorHandling))
    );
  }

  /**
   * Performs a PUT request
   * 
   * @param endpoint API endpoint
   * @param body Request body
   * @param options Request options
   * @returns Observable of the response
   */
  put<T>(endpoint: string, body: any, options: ApiRequestOptions = {}): Observable<T> {
    const url = this.buildUrl(endpoint);
    
    return this.http.put<T>(url, body, {
      headers: options.headers as HttpHeaders,
      params: options.params as HttpParams,
      reportProgress: options.reportProgress,
      responseType: options.responseType as any,
      withCredentials: options.withCredentials,
      context: options.context
    }).pipe(
      timeout(options.timeoutMs || this.defaultTimeout),
      retry({
        count: options.retries ?? this.defaultRetries,
        delay: this.retryStrategy
      }),
      catchError(error => this.handleError<T>(error, options.skipErrorHandling))
    );
  }

  /**
   * Performs a PATCH request
   * 
   * @param endpoint API endpoint
   * @param body Request body
   * @param options Request options
   * @returns Observable of the response
   */
  patch<T>(endpoint: string, body: any, options: ApiRequestOptions = {}): Observable<T> {
    const url = this.buildUrl(endpoint);
    
    return this.http.patch<T>(url, body, {
      headers: options.headers as HttpHeaders,
      params: options.params as HttpParams,
      reportProgress: options.reportProgress,
      responseType: options.responseType as any,
      withCredentials: options.withCredentials,
      context: options.context
    }).pipe(
      timeout(options.timeoutMs || this.defaultTimeout),
      retry({
        count: options.retries ?? this.defaultRetries,
        delay: this.retryStrategy
      }),
      catchError(error => this.handleError<T>(error, options.skipErrorHandling))
    );
  }

  /**
   * Performs a DELETE request
   * 
   * @param endpoint API endpoint
   * @param options Request options
   * @returns Observable of the response
   */
  delete<T>(endpoint: string, options: ApiRequestOptions = {}): Observable<T> {
    const url = this.buildUrl(endpoint);
    
    return this.http.delete<T>(url, {
      headers: options.headers as HttpHeaders,
      params: options.params as HttpParams,
      reportProgress: options.reportProgress,
      responseType: options.responseType as any,
      withCredentials: options.withCredentials,
      body: options.body,
      context: options.context
    }).pipe(
      timeout(options.timeoutMs || this.defaultTimeout),
      retry({
        count: options.retries ?? this.defaultRetries,
        delay: this.retryStrategy
      }),
      catchError(error => this.handleError<T>(error, options.skipErrorHandling))
    );
  }

  /**
   * Builds a full URL from an endpoint
   * 
   * @param endpoint API endpoint
   * @returns Full URL
   */
  private buildUrl(endpoint: string): string {
    // If endpoint already has a protocol, assume it's a full URL
    if (endpoint.startsWith('http')) {
      return endpoint;
    }
    
    // If endpoint starts with a slash, use it as is
    // Otherwise, add a slash between base URL and endpoint
    const urlSeparator = endpoint.startsWith('/') ? '' : '/';
    
    return `${this.apiBaseUrl}${urlSeparator}${endpoint}`;
  }

  /**
   * Retry strategy for failed requests
   * 
   * @param error Error
   * @param retryCount Retry count
   * @returns Delay in milliseconds
   */
  private retryStrategy(error: Observable<any>, retryCount: number): Observable<number> {
    // Only retry on network errors or 5xx server errors
    if (error instanceof HttpErrorResponse) {
      if (error.status === 0 || (error.status >= 500 && error.status < 600)) {
        // Exponential backoff strategy: 1s, 2s, 4s, etc.
        const delay = Math.pow(2, retryCount) * 1000;
        // Maximum delay of 10 seconds
        const cappedDelay = Math.min(delay, 10000);
        
        console.warn(`Retrying API request after ${cappedDelay}ms due to ${error.status} error`);
        return new Observable<number>(observer => {
          setTimeout(() => {
            observer.next(cappedDelay);
            observer.complete();
          }, cappedDelay);
        });
      }
    }
    
    // Don't retry for other errors
    return throwError(() => error);
  }

  /**
   * Builds HTTP parameters from an object
   * 
   * @param params Parameter object
   * @returns HttpParams object
   */
  buildParams(params: Record<string, any>): Record<string, string> {
    const result: Record<string, string> = {};
    
    Object.entries(params).forEach(([key, value]) => {
      // Skip undefined or null values
      if (value === undefined || value === null) {
        return;
      }
      
      // Convert booleans to strings
      if (typeof value === 'boolean') {
        result[key] = value.toString();
      }
      // Convert numbers to strings
      else if (typeof value === 'number') {
        result[key] = value.toString();
      }
      // Use string values directly
      else if (typeof value === 'string') {
        result[key] = value;
      }
      // Convert arrays to comma-separated strings
      else if (Array.isArray(value)) {
        result[key] = value.join(',');
      }
      // Convert dates to ISO strings
      else if (value instanceof Date) {
        result[key] = value.toISOString();
      }
      // Stringify objects
      else if (typeof value === 'object') {
        result[key] = JSON.stringify(value);
      }
    });
    
    return result;
  }

  /**
   * Handles API errors
   * 
   * @param error Error
   * @param skipErrorHandling Skip error handling flag
   * @returns Observable that throws the error
   */
  private handleError<T>(error: any, skipErrorHandling = false): Observable<T> {
    if (skipErrorHandling) {
      return throwError(() => error);
    }

    let appError: AppError;

    if (error instanceof HttpErrorResponse) {
      if (error.status === 0) {
        // Network error
        appError = createAppError({
          type: ErrorType.NETWORK,
          message: 'Network error. Please check your internet connection.',
          originalError: error
        });
      } else if (error.status === 401) {
        // Unauthorized
        appError = createAppError({
          type: ErrorType.AUTHENTICATION,
          message: 'You are not authorized to access this resource.',
          originalError: error
        });
      } else if (error.status === 403) {
        // Forbidden
        appError = createAppError({
          type: ErrorType.AUTHORIZATION,
          message: 'You do not have permission to access this resource.',
          originalError: error
        });
      } else if (error.status === 404) {
        // Not found
        appError = createAppError({
          type: ErrorType.NOT_FOUND,
          message: 'The requested resource was not found.',
          originalError: error
        });
      } else if (error.status === 422) {
        // Validation error
        appError = createAppError({
          type: ErrorType.VALIDATION,
          message: 'Validation error. Please check your input.',
          validationErrors: error.error?.errors || error.error?.message || 'Validation failed',
          originalError: error
        });
      } else if (error.status >= 500) {
        // Server error
        appError = createAppError({
          type: ErrorType.SERVER,
          message: 'Server error. Please try again later or contact support.',
          originalError: error
        });
      } else {
                  // Other HTTP errors
        appError = createAppError({
          type: ErrorType.UNKNOWN,
          message: `HTTP error ${error.status}: ${error.statusText}`,
          originalError: error
        });
      }
    } else {
      // Client-side error
      appError = createAppError({
        type: ErrorType.UNKNOWN,
        message: error.message || 'An unexpected error occurred.',
        originalError: error
      });
    }

    console.error('API error:', appError);
    return throwError(() => appError);
  }
}