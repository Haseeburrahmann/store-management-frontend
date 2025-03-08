import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';

import { API_CONFIG } from '../config/api-config';
import { ErrorService } from './error.service';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  constructor(
    private http: HttpClient,
    private errorService: ErrorService
  ) {}

  /**
   * Get the full API URL
   */
  private getFullUrl(endpoint: string): string {
    return `${API_CONFIG.baseUrl}${API_CONFIG.apiPrefix}${endpoint}`;
  }

  /**
   * Generic GET request
   */
  get<T>(endpoint: string, params?: any, headers?: HttpHeaders): Observable<T> {
    const options = {
      params: new HttpParams({ fromObject: params || {} }),
      headers: headers
    };

    return this.http.get<T>(this.getFullUrl(endpoint), options)
      .pipe(
        timeout(API_CONFIG.timeout),
        catchError(error => this.handleError(error, endpoint))
      );
  }

  /**
   * Generic POST request
   */
  post<T>(endpoint: string, data: any, headers?: HttpHeaders): Observable<T> {
    return this.http.post<T>(this.getFullUrl(endpoint), data, { headers })
      .pipe(
        timeout(API_CONFIG.timeout),
        catchError(error => this.handleError(error, endpoint))
      );
  }

  /**
   * Generic PUT request
   */
  put<T>(endpoint: string, data: any, headers?: HttpHeaders): Observable<T> {
    return this.http.put<T>(this.getFullUrl(endpoint), data, { headers })
      .pipe(
        timeout(API_CONFIG.timeout),
        catchError(error => this.handleError(error, endpoint))
      );
  }

  /**
   * Generic DELETE request
   */
  delete<T>(endpoint: string, headers?: HttpHeaders): Observable<T> {
    return this.http.delete<T>(this.getFullUrl(endpoint), { headers })
      .pipe(
        timeout(API_CONFIG.timeout),
        catchError(error => this.handleError(error, endpoint))
      );
  }

  /**
   * Handle HTTP errors
   */
  private handleError(error: any, endpoint: string): Observable<never> {
    console.error(`API Error for ${endpoint}:`, error);
    return this.errorService.handleError(error);
  }
}