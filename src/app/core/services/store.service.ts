// src/app/core/services/store.service.ts

import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { Store, StoreCreate, StoreUpdate, StoreResponse } from '../../shared/models/store.model';
import { ApiService } from './api.service';
import { User } from '../auth/models/user.model';

@Injectable({
  providedIn: 'root'
})
export class StoreService {
  private endpoint = '/stores';

  constructor(private apiService: ApiService) { }

  /**
   * Get paginated and filtered list of stores
   * @param skip Number of items to skip
   * @param limit Maximum number of items to return
   * @param search Optional search term
   * @param status Optional status filter
   * @returns Observable of Store array
   */
  getStores(
    skip: number = 0, 
    limit: number = 100, 
    search?: string, 
    status?: string
  ): Observable<Store[]> {
    const params = this.apiService.buildParams({
      skip,
      limit,
      search,
      status
    });
    
    return this.apiService.get<StoreResponse[]>(this.endpoint, params).pipe(
      map(stores => stores.map(store => this.formatStoreResponse(store))),
      catchError(error => {
        console.error('Error fetching stores:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get a specific store by ID
   * @param id Store ID
   * @returns Observable of Store
   */
  getStore(id: string): Observable<Store> {
    const formattedId = id.toString();
    
    return this.apiService.get<StoreResponse>(`${this.endpoint}/${formattedId}`).pipe(
      map(response => this.formatStoreResponse(response)),
      catchError(error => {
        console.error(`Error fetching store with ID ${id}:`, error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Create a new store
   * @param store Store creation data
   * @returns Observable of created Store
   */
  createStore(store: StoreCreate): Observable<Store> {
    // Ensure IDs are strings
    const formattedStore = { ...store };
    
    if (formattedStore.manager_id) {
      formattedStore.manager_id = formattedStore.manager_id.toString();
    }
    
    return this.apiService.post<StoreResponse>(this.endpoint, formattedStore).pipe(
      map(response => this.formatStoreResponse(response)),
      catchError(error => {
        console.error('Error creating store:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Update an existing store
   * @param id Store ID
   * @param store Store update data
   * @returns Observable of updated Store
   */
  updateStore(id: string, store: StoreUpdate): Observable<Store> {
    const formattedId = id.toString();
    
    // Ensure IDs are strings
    const formattedStore = { ...store };
    
    if (formattedStore.manager_id) {
      formattedStore.manager_id = formattedStore.manager_id.toString();
    }
    
    return this.apiService.put<StoreResponse>(`${this.endpoint}/${formattedId}`, formattedStore).pipe(
      map(response => this.formatStoreResponse(response)),
      catchError(error => {
        console.error(`Error updating store with ID ${id}:`, error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Delete a store
   * @param id Store ID
   * @returns Observable of deletion result
   */
  deleteStore(id: string): Observable<any> {
    const formattedId = id.toString();
    
    return this.apiService.delete(`${this.endpoint}/${formattedId}`).pipe(
      catchError(error => {
        console.error(`Error deleting store with ID ${id}:`, error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Assign a manager to a store
   * @param storeId Store ID
   * @param managerId Manager ID
   * @returns Observable of updated Store
   */
  assignManager(storeId: string, managerId: string): Observable<Store> {
    const formattedStoreId = storeId.toString();
    const formattedManagerId = managerId.toString();
    
    return this.apiService.put<StoreResponse>(
      `${this.endpoint}/${formattedStoreId}/assign-manager/${formattedManagerId}`, 
      {}
    ).pipe(
      map(response => this.formatStoreResponse(response)),
      catchError(error => {
        console.error(`Error assigning manager ${managerId} to store ${storeId}:`, error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get stores managed by the current user
   * @returns Observable of Store array
   */
  getManagedStores(): Observable<Store[]> {
    return this.apiService.get<StoreResponse[]>(`${this.endpoint}/managed`).pipe(
      map(stores => stores.map(store => this.formatStoreResponse(store))),
      catchError(error => {
        console.error('Error fetching managed stores:', error);
        return throwError(() => error);
      })
    );
  }

 /**
 * Format the store response to ensure consistent structure
 * @param store Store response from API
 * @returns Formatted Store object
 */
private formatStoreResponse(store: StoreResponse): Store {
  // Create a properly typed User object for manager if it exists
  let formattedManager: User | undefined = undefined;
  
  if (store.manager) {
    formattedManager = {
      _id: store.manager._id ? store.manager._id.toString() : '',
      email: store.manager.email || '',
      full_name: store.manager.full_name || '',
      role_id: store.manager.role_id ? store.manager.role_id.toString() : undefined,
      is_active: true,  // Default value since it might not be in the API response
      created_at: new Date().toISOString(), // Default since it might not be in API response
      updated_at: new Date().toISOString()  // Default since it might not be in API response
    };
  }
  
  return {
    ...store,
    _id: store._id ? store._id.toString() : '',
    manager_id: store.manager_id ? store.manager_id.toString() : undefined,
    // Use the properly formatted manager
    manager: formattedManager,
    created_at: typeof store.created_at === 'string' ? 
      store.created_at : 
      new Date(store.created_at).toISOString(),
    updated_at: typeof store.updated_at === 'string' ? 
      store.updated_at : 
      new Date(store.updated_at).toISOString()
  };
}
}