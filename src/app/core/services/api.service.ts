// src/app/core/services/api.service.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

/**
 * Base API service that handles common HTTP operations and error handling
 */
@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /**
   * Make a GET request to the API
   * @param endpoint Endpoint path (without base URL)
   * @param params Optional query parameters
   * @returns Observable of response data
   */
  get<T>(endpoint: string, params?: HttpParams | Record<string, string | number | boolean>): Observable<T> {
    return this.http.get<T>(`${this.baseUrl}${endpoint}`, { params })
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Make a POST request to the API
   * @param endpoint Endpoint path (without base URL)
   * @param data Request body data
   * @returns Observable of response data
   */
  post<T>(endpoint: string, data: any): Observable<T> {
    return this.http.post<T>(`${this.baseUrl}${endpoint}`, data)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Make a PUT request to the API
   * @param endpoint Endpoint path (without base URL)
   * @param data Request body data
   * @returns Observable of response data
   */
  put<T>(endpoint: string, data: any): Observable<T> {
    return this.http.put<T>(`${this.baseUrl}${endpoint}`, data)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Make a DELETE request to the API
   * @param endpoint Endpoint path (without base URL)
   * @returns Observable of response data
   */
  delete<T>(endpoint: string): Observable<T> {
    return this.http.delete<T>(`${this.baseUrl}${endpoint}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Standardized error handling for HTTP requests
   * @param error HTTP error response
   * @returns Observable with error
   */
  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'An unknown error occurred';
    
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Client error: ${error.error.message}`;
    } else {
      // Server-side error
      if (error.status === 422) {
        // Handle validation errors (Unprocessable Entity)
        try {
          if (typeof error.error === 'object') {
            if (error.error.detail) {
              // FastAPI validation error format
              errorMessage = `Validation error: ${error.error.detail}`;
            } else {
              // Try to extract validation errors from object
              const details = [];
              for (const key in error.error) {
                if (error.error.hasOwnProperty(key)) {
                  const value = error.error[key];
                  if (Array.isArray(value)) {
                    details.push(`${key}: ${value.join(', ')}`);
                  } else {
                    details.push(`${key}: ${value}`);
                  }
                }
              }
              
              if (details.length > 0) {
                errorMessage = `Validation errors: ${details.join('; ')}`;
              } else {
                errorMessage = `Validation error: ${JSON.stringify(error.error)}`;
              }
            }
          } else if (typeof error.error === 'string') {
            errorMessage = error.error;
          } else {
            errorMessage = 'Invalid data provided';
          }
        } catch (e) {
          errorMessage = 'Failed to process the error response';
          console.error('Error parsing validation error:', e);
        }
      } else if (error.error && error.error.detail) {
        errorMessage = error.error.detail;
      } else if (error.error && typeof error.error === 'string') {
        errorMessage = error.error;
      } else if (error.status) {
        // Status-based messages
        switch (error.status) {
          case 400: errorMessage = 'Bad request'; break;
          case 403: errorMessage = 'Forbidden - You do not have permission to access this resource'; break;
          case 404: errorMessage = 'Resource not found'; break;
          case 500: errorMessage = 'Server error - Please try again later'; break;
          default: errorMessage = `Error ${error.status}: ${error.statusText || 'Unknown error'}`;
        }
      }
    }
    
    console.error('API Error:', error);
    return throwError(() => new Error(errorMessage));
  }

  /**
   * Helper method to build HttpParams from an object
   * @param params Object with parameter key-value pairs
   * @returns HttpParams object
   */
  buildParams(params: Record<string, any>): HttpParams {
    let httpParams = new HttpParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        httpParams = httpParams.set(key, value.toString());
      }
    });
    
    return httpParams;
  }
}