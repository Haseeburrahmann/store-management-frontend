// src/app/core/services/store.service.ts

import { Injectable } from '@angular/core';
import { Observable, throwError, of } from 'rxjs';
import { catchError, map, shareReplay, tap } from 'rxjs/operators';
import { HttpContext } from '@angular/common/http';

import { ApiService } from './api.service';
import { CacheService } from './cache.service';
import { ErrorService } from './error.service';
import { ApiConfig } from '../config/api-config';
import { CacheConfig } from '../config/cache-config';
import { CACHE_TAGS, CACHE_TTL } from '../interceptors/cache.interceptor';
import { createAppError, ErrorType } from '../utils/error-handler';

export interface Store {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  phone: string;
  email: string;
  manager_id?: string;
  manager?: {
    id: string;
    full_name: string;
    email: string;
  };
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface StoreCreate {
  name: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  phone: string;
  email: string;
  manager_id?: string;
  is_active?: boolean;
}

export interface StoreUpdate {
  name?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  phone?: string;
  email?: string;
  manager_id?: string | null;
  is_active?: boolean;
}

export interface StoreQueryParams {
  page?: number;
  pageSize?: number;
  search?: string;
  city?: string;
  state?: string;
  is_active?: boolean;
  has_manager?: boolean;
  sort_by?: string;
  sort_dir?: 'asc' | 'desc';
}

export interface StoreList {
  data: Store[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  
  // Added methods to make StoreList compatible with Store[]
  filter?: (predicate: (value: Store, index: number, array: Store[]) => unknown) => Store[];
  length?: number;
}

/**
 * Enhanced Store Service with caching and error handling
 */
@Injectable({
  providedIn: 'root'
})
export class StoreService {
  private readonly baseUrl = ApiConfig.endpoints.stores.base;
  private readonly cacheKey = CacheConfig.keys.stores;
  private readonly cacheTags = [CacheConfig.tags.stores];
  private readonly cacheTTL = CacheConfig.ttl.stores;

  constructor(
    private apiService: ApiService,
    private cacheService: CacheService,
    private errorService: ErrorService
  ) {}

  /**
   * Gets a list of stores with pagination and filtering
   * 
   * @param params Query parameters
   * @returns Observable of store list
   */
  getStores(params: StoreQueryParams = {}): Observable<StoreList> {
    const queryParams: Record<string, any> = {
      page: params.page?.toString() || '1',
      page_size: params.pageSize?.toString() || '10'
    };

    // Add optional parameters if provided
    if (params.search) queryParams['search'] = params.search;
    if (params.city) queryParams['city'] = params.city;
    if (params.state) queryParams['state'] = params.state;
    if (params.is_active !== undefined) queryParams['is_active'] = params.is_active.toString();
    if (params.has_manager !== undefined) queryParams['has_manager'] = params.has_manager.toString();
    if (params.sort_by) queryParams['sort_by'] = params.sort_by;
    if (params.sort_dir) queryParams['sort_dir'] = params.sort_dir;

    // Create cache context with appropriate tags and TTL
    const context = new HttpContext()
      .set(CACHE_TAGS, this.cacheTags)
      .set(CACHE_TTL, this.cacheTTL);

    return this.apiService.get<StoreList>(this.baseUrl, {
      params: queryParams,
      context
    }).pipe(
      map(response => {
        // Assuming the API returns a structure with data and pagination
        const result: StoreList = {
          data: Array.isArray(response) ? response : (response as any).data || [],
          total: (response as any).meta?.pagination?.total || 
                 (Array.isArray(response) ? response.length : (response as any).data?.length || 0),
          page: parseInt(queryParams['page'], 10),
          pageSize: parseInt(queryParams['page_size'], 10),
          totalPages: (response as any).meta?.pagination?.totalPages || 
                      Math.ceil(((response as any).meta?.pagination?.total || 
                      (Array.isArray(response) ? response.length : (response as any).data?.length || 0)) / 
                      parseInt(queryParams['page_size'], 10))
        };
        
        // Add array-like methods to make StoreList compatible with Store[]
        const data = result.data;
        result.length = data.length;
        result.filter = (predicate) => data.filter(predicate);
        
        return result;
      }),
      catchError(error => {
        this.errorService.logError(error, { 
          context: 'StoreService.getStores', 
          params 
        });
        return throwError(() => error);
      }),
      shareReplay(1)
    );
  }

  /**
   * Gets a store by ID
   * 
   * @param id Store ID
   * @returns Observable of store
   */
  getStore(id: string): Observable<Store> {
    const url = ApiConfig.endpoints.stores.detail(id);
    const cacheKey = `${this.cacheKey}_${id}`;
    
    // Check cache first
    const cachedStore = this.cacheService.get<Store>(cacheKey);
    if (cachedStore) {
      return of(cachedStore);
    }

    // Create cache context with appropriate tags and TTL
    const context = new HttpContext()
      .set(CACHE_TAGS, this.cacheTags)
      .set(CACHE_TTL, this.cacheTTL);

    return this.apiService.get<Store>(url, { context }).pipe(
      tap(store => {
        // Cache the result
        this.cacheService.set(
          { key: cacheKey, ttl: this.cacheTTL, tag: this.cacheTags },
          store
        );
      }),
      catchError(error => {
        this.errorService.logError(error, { 
          context: 'StoreService.getStore', 
          storeId: id 
        });
        
        if (error.type === ErrorType.NOT_FOUND) {
          return throwError(() => createAppError({
            type: ErrorType.NOT_FOUND,
            message: `Store with ID ${id} not found.`
          }));
        }
        
        return throwError(() => error);
      }),
      shareReplay(1)
    );
  }

  /**
   * Creates a new store
   * 
   * @param store Store data
   * @returns Observable of created store
   */
  createStore(store: StoreCreate): Observable<Store> {
    return this.apiService.post<Store>(this.baseUrl, store).pipe(
      tap(_ => {
        // Invalidate cache
        this.cacheService.invalidateByTag(CacheConfig.tags.stores);
      }),
      catchError(error => {
        this.errorService.logError(error, { 
          context: 'StoreService.createStore',
          storeData: store
        });
        
        // Handle specific validation errors
        if (error.type === ErrorType.VALIDATION) {
          return throwError(() => error);
        }
        
        return throwError(() => error);
      })
    );
  }

  /**
   * Updates a store
   * 
   * @param id Store ID
   * @param store Store data
   * @returns Observable of updated store
   */
  updateStore(id: string, store: StoreUpdate): Observable<Store> {
    const url = ApiConfig.endpoints.stores.detail(id);
    const cacheKey = `${this.cacheKey}_${id}`;

    return this.apiService.put<Store>(url, store).pipe(
      tap(updatedStore => {
        // Update cache
        this.cacheService.set(
          { key: cacheKey, ttl: this.cacheTTL, tag: this.cacheTags },
          updatedStore
        );
        
        // Invalidate related caches
        this.cacheService.invalidateByTag(CacheConfig.tags.stores);
      }),
      catchError(error => {
        this.errorService.logError(error, { 
          context: 'StoreService.updateStore',
          storeId: id,
          storeData: store
        });
        
        if (error.type === ErrorType.NOT_FOUND) {
          return throwError(() => createAppError({
            type: ErrorType.NOT_FOUND,
            message: `Store with ID ${id} not found.`
          }));
        }
        
        return throwError(() => error);
      })
    );
  }

  /**
   * Deletes a store
   * 
   * @param id Store ID
   * @returns Observable of operation success
   */
  deleteStore(id: string): Observable<void> {
    const url = ApiConfig.endpoints.stores.detail(id);
    const cacheKey = `${this.cacheKey}_${id}`;

    return this.apiService.delete<void>(url).pipe(
      tap(_ => {
        // Remove from cache
        this.cacheService.remove(cacheKey);
        
        // Invalidate related caches
        this.cacheService.invalidateByTag(CacheConfig.tags.stores);
      }),
      catchError(error => {
        this.errorService.logError(error, { 
          context: 'StoreService.deleteStore',
          storeId: id
        });
        
        if (error.type === ErrorType.NOT_FOUND) {
          return throwError(() => createAppError({
            type: ErrorType.NOT_FOUND,
            message: `Store with ID ${id} not found.`
          }));
        }
        
        return throwError(() => error);
      })
    );
  }

  /**
   * Assigns a manager to a store
   * 
   * @param storeId Store ID
   * @param managerId User ID of the manager
   * @returns Observable of updated store
   */
  assignManager(storeId: string, managerId: string): Observable<Store> {
    const url = ApiConfig.endpoints.stores.assignManager(storeId, managerId);
    const cacheKey = `${this.cacheKey}_${storeId}`;

    return this.apiService.put<Store>(url, {}).pipe(
      tap(updatedStore => {
        // Update cache
        this.cacheService.set(
          { key: cacheKey, ttl: this.cacheTTL, tag: this.cacheTags },
          updatedStore
        );
        
        // Invalidate related caches
        this.cacheService.invalidateByTag(CacheConfig.tags.stores);
        this.cacheService.invalidateByTag(CacheConfig.tags.users);
      }),
      catchError(error => {
        this.errorService.logError(error, { 
          context: 'StoreService.assignManager',
          storeId,
          managerId
        });
        
        if (error.type === ErrorType.NOT_FOUND) {
          return throwError(() => createAppError({
            type: ErrorType.NOT_FOUND,
            message: `Store or user not found.`
          }));
        }
        
        return throwError(() => error);
      })
    );
  }

  /**
   * Removes a manager from a store
   * 
   * @param storeId Store ID
   * @returns Observable of updated store
   */
  removeManager(storeId: string): Observable<Store> {
    // Use updateStore with null manager_id
    return this.updateStore(storeId, { manager_id: null });
  }

  /**
   * Activates or deactivates a store
   * 
   * @param id Store ID
   * @param active Whether to activate or deactivate
   * @returns Observable of updated store
   */
  setStoreActive(id: string, active: boolean): Observable<Store> {
    return this.updateStore(id, { is_active: active });
  }

  /**
   * Clears the store cache
   */
  clearCache(): void {
    this.cacheService.invalidateByTag(CacheConfig.tags.stores);
  }
  
  /**
   * Gets all stores without pagination (for dropdowns, etc.)
   * 
   * @returns Observable of stores array
   */
  getAllStores(): Observable<Store[]> {
    const url = this.baseUrl;
    const cacheKey = `${this.cacheKey}_all`;
    
    // Check cache first
    const cachedStores = this.cacheService.get<Store[]>(cacheKey);
    if (cachedStores) {
      return of(cachedStores);
    }
    
    // Set a large page size to get all stores
    const queryParams = {
      'page_size': '1000',
      'is_active': 'true'
    };
    
    // Create cache context with appropriate tags and TTL
    const context = new HttpContext()
      .set(CACHE_TAGS, this.cacheTags)
      .set(CACHE_TTL, this.cacheTTL);
    
    return this.apiService.get<StoreList>(url, {
      params: queryParams,
      context
    }).pipe(
      map(response => {
        // Get the data array from the response
        const stores = Array.isArray(response) ? response : 
                     (response as any).data || [];
        
        // Cache the result
        this.cacheService.set(
          { key: cacheKey, ttl: this.cacheTTL, tag: this.cacheTags },
          stores
        );
        
        return stores;
      }),
      catchError(error => {
        this.errorService.logError(error, { 
          context: 'StoreService.getAllStores'
        });
        return throwError(() => error);
      }),
      shareReplay(1)
    );
  }
  
  /**
   * Gets stores managed by a specific user
   * 
   * @param managerId Manager user ID
   * @returns Observable of stores array
   */
  getStoresByManager(managerId: string): Observable<Store[]> {
    const cacheKey = `${this.cacheKey}_manager_${managerId}`;
    
    // Check cache first
    const cachedStores = this.cacheService.get<Store[]>(cacheKey);
    if (cachedStores) {
      return of(cachedStores);
    }
    
    const queryParams = {
      'manager_id': managerId,
      'is_active': 'true',
      'page_size': '1000' // Large page size to get all stores
    };
    
    // Create cache context with appropriate tags and TTL
    const context = new HttpContext()
      .set(CACHE_TAGS, this.cacheTags)
      .set(CACHE_TTL, this.cacheTTL);
    
    return this.apiService.get<StoreList>(this.baseUrl, {
      params: queryParams,
      context
    }).pipe(
      map(response => {
        // Get the data array from the response
        const stores = Array.isArray(response) ? response : 
                     (response as any).data || [];
        
        // Cache the result
        this.cacheService.set(
          { key: cacheKey, ttl: this.cacheTTL, tag: this.cacheTags },
          stores
        );
        
        return stores;
      }),
      catchError(error => {
        this.errorService.logError(error, { 
          context: 'StoreService.getStoresByManager',
          managerId
        });
        return throwError(() => error);
      }),
      shareReplay(1)
    );
  }
}