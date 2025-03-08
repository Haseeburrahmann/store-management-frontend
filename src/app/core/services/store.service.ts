// src/app/core/services/store.service.ts
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { ApiService } from './api.service';
import { DataAccessService } from './data-access.service';
import { API_CONFIG } from '../config/api-config';
import { Store, StoreCreate, StoreUpdate } from '../../shared/models/store.model';

@Injectable({
  providedIn: 'root'
})
export class StoreService {
  private cacheKey = 'stores';
  
  constructor(
    private apiService: ApiService,
    private dataAccess: DataAccessService
  ) {}
  
  /**
   * Get all stores with optional filtering
   */
  getStores(params?: {
    skip?: number;
    limit?: number;
    name?: string;
    city?: string;
    manager_id?: string;
  }, refresh = false): Observable<Store[]> {
    return this.dataAccess.getData(
      this.cacheKey,
      () => this.apiService.get<Store[]>(API_CONFIG.stores.base, params),
      refresh
    );
  }
  
  /**
   * Get stores managed by the current user
   */
  getManagedStores(refresh = false): Observable<Store[]> {
    return this.dataAccess.getData(
      `${this.cacheKey}_managed`,
      () => this.apiService.get<Store[]>(API_CONFIG.stores.managed),
      refresh
    );
  }
  
  /**
   * Get store by ID
   */
  getStore(id: string): Observable<Store> {
    return this.apiService.get<Store>(API_CONFIG.stores.getById(id));
  }
  
  /**
   * Create a new store
   */
  createStore(store: StoreCreate): Observable<Store> {
    return this.apiService.post<Store>(API_CONFIG.stores.base, store)
      .pipe(
        map(newStore => {
          // Update cache with new store
          this.updateStoreCache(newStore);
          return newStore;
        })
      );
  }
  
  /**
   * Update an existing store
   */
  updateStore(id: string, store: StoreUpdate): Observable<Store> {
    return this.apiService.put<Store>(API_CONFIG.stores.getById(id), store)
      .pipe(
        map(updatedStore => {
          // Update cache with updated store
          this.updateStoreCache(updatedStore);
          return updatedStore;
        })
      );
  }
  
  /**
   * Delete a store
   */
  deleteStore(id: string): Observable<boolean> {
    return this.apiService.delete<boolean>(API_CONFIG.stores.getById(id))
      .pipe(
        map(result => {
          if (result) {
            // Remove store from cache
            this.removeStoreFromCache(id);
          }
          return result;
        })
      );
  }
  
  /**
   * Assign a manager to a store
   */
  assignManager(storeId: string, managerId: string): Observable<Store> {
    return this.apiService.put<Store>(
      API_CONFIG.stores.assignManager(storeId, managerId), 
      {}
    ).pipe(
      map(updatedStore => {
        // Update cache with updated store
        this.updateStoreCache(updatedStore);
        return updatedStore;
      })
    );
  }
  
  /**
   * Update the cached stores list with a new or updated store
   */
  private updateStoreCache(store: Store): void {
    const cached = this.dataAccess.getData(
      this.cacheKey,
      () => this.apiService.get<Store[]>(API_CONFIG.stores.base)
    );
    
    cached.subscribe(stores => {
      if (stores) {
        // Find and replace or add the store
        const index = stores.findIndex(s => s._id === store._id);
        if (index >= 0) {
          stores[index] = store;
        } else {
          stores.push(store);
        }
        
        // Update cache
        this.dataAccess.updateData(this.cacheKey, stores);
      }
    });
  }
  
  /**
   * Remove a store from the cached stores list
   */
  private removeStoreFromCache(id: string): void {
    const cached = this.dataAccess.getData(
      this.cacheKey,
      () => this.apiService.get<Store[]>(API_CONFIG.stores.base)
    );
    
    cached.subscribe(stores => {
      if (stores) {
        // Filter out the deleted store
        const filtered = stores.filter(s => s._id !== id);
        
        // Update cache
        this.dataAccess.updateData(this.cacheKey, filtered);
      }
    });
  }
}