// src/app/core/services/inventory.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, tap, map } from 'rxjs/operators';
import { InventoryRequest, InventoryRequestUtils } from '../../shared/models/inventory-request.model';
import { IdUtils } from '../utils/id-utils.service';
import { ErrorHandlingService } from '../utils/error-handling.service';

@Injectable({
  providedIn: 'root'
})
export class InventoryService {
  private apiUrl = '/api/v1/inventory-requests';
  
  constructor(private http: HttpClient) {}
  
   /**
   * Get all inventory requests with optional filtering
   */
   getInventoryRequests(options: {
    skip?: number,
    limit?: number,
    store_id?: string,
    employee_id?: string,
    status?: string
  } = {}): Observable<InventoryRequest[]> {
    // Create safe params for API request
    const safeParams = IdUtils.createIdParams(options);
    let params = new HttpParams();
    
    Object.keys(safeParams).forEach(key => {
      params = params.set(key, safeParams[key]);
    });
    
    return this.http.get<InventoryRequest[]>(this.apiUrl, { params }).pipe(
      tap(requests => console.log(`Fetched ${requests.length} inventory requests`)),
      map(requests => requests || []), // Ensure we always return an array
      catchError(error => {
        console.error(`Error fetching inventory requests: ${error.message}`);
        return of([]);
      })
    );
  }
  
  /**
   * Get inventory request by ID
   */
  getInventoryRequestById(id: string): Observable<InventoryRequest> {
    // Ensure ID is string format
    const safeId = IdUtils.ensureString(id);
    const url = `${this.apiUrl}/${safeId}`;
    
    return this.http.get<InventoryRequest>(url).pipe(
      tap(_ => console.log(`Fetched inventory request id=${safeId}`)),
      map(request => InventoryRequestUtils.ensureComplete(request)),
      catchError(ErrorHandlingService.handleError<InventoryRequest>(`getInventoryRequestById id=${safeId}`))
    );
  }
  
  /**
   * Get inventory requests for current employee
   */
  getMyInventoryRequests(options: {
    skip?: number,
    limit?: number,
    status?: string
  } = {}): Observable<InventoryRequest[]> {
    let params = new HttpParams();
    
    if (options.skip !== undefined) params = params.set('skip', options.skip.toString());
    if (options.limit !== undefined) params = params.set('limit', options.limit.toString());
    if (options.status) params = params.set('status', options.status);
    
    return this.http.get<InventoryRequest[]>(`${this.apiUrl}/me`, { params }).pipe(
      tap(requests => console.log(`Fetched ${requests.length} of my inventory requests`)),
      map(requests => requests || []), // Ensure we always return an array
      catchError(error => {
        console.error(`Error fetching my inventory requests: ${error.message}`);
        return of([]);
      })
    );
  }
  
  /**
   * Get inventory requests for specific store
   */
  getStoreInventoryRequests(storeId: string, options: {
    skip?: number,
    limit?: number,
    status?: string
  } = {}): Observable<InventoryRequest[]> {
    // Ensure store ID is string format
    const safeStoreId = IdUtils.ensureString(storeId);
    let params = new HttpParams();
    
    if (options.skip !== undefined) params = params.set('skip', options.skip.toString());
    if (options.limit !== undefined) params = params.set('limit', options.limit.toString());
    if (options.status) params = params.set('status', options.status);
    
    return this.http.get<InventoryRequest[]>(`${this.apiUrl}/store/${safeStoreId}`, { params }).pipe(
      tap(requests => console.log(`Fetched ${requests.length} inventory requests for store ${safeStoreId}`)),
      map(requests => requests || []), // Ensure we always return an array
      catchError(error => {
        console.error(`Error fetching store inventory requests: ${error.message}`);
        return of([]);
      })
    );
  }
  
  /**
   * Create a new inventory request
   */
  createInventoryRequest(request: Partial<InventoryRequest>): Observable<InventoryRequest> {
    return this.http.post<InventoryRequest>(this.apiUrl, request).pipe(
      tap((newRequest: InventoryRequest) => console.log(`Created inventory request id=${newRequest._id}`)),
      catchError(ErrorHandlingService.handleError<InventoryRequest>('createInventoryRequest'))
    );
  }
  
  /**
   * Mark inventory request as fulfilled
   */
  fulfillInventoryRequest(id: string, notes?: string): Observable<InventoryRequest> {
    // Ensure ID is string format
    const safeId = IdUtils.ensureString(id);
    
    return this.http.put<InventoryRequest>(`${this.apiUrl}/${safeId}/fulfill`, { notes }).pipe(
      tap(_ => console.log(`Fulfilled inventory request id=${safeId}`)),
      catchError(ErrorHandlingService.handleError<InventoryRequest>(`fulfillInventoryRequest id=${safeId}`))
    );
  }
  
  /**
   * Cancel inventory request
   */
  cancelInventoryRequest(id: string, notes?: string): Observable<InventoryRequest> {
    // Ensure ID is string format
    const safeId = IdUtils.ensureString(id);
    
    return this.http.put<InventoryRequest>(`${this.apiUrl}/${safeId}/cancel`, { notes }).pipe(
      tap(_ => console.log(`Cancelled inventory request id=${safeId}`)),
      catchError(ErrorHandlingService.handleError<InventoryRequest>(`cancelInventoryRequest id=${safeId}`))
    );
  }
}