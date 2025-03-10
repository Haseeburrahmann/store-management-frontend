// src/app/core/services/store.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, forkJoin } from 'rxjs';
import { catchError, tap, map, switchMap } from 'rxjs/operators';
import { Store } from '../../shared/models/store.model';
import { UserService } from './user.service';

@Injectable({
  providedIn: 'root'
})
export class StoreService {
  private apiUrl = '/api/v1/stores';
  
  constructor(
    private http: HttpClient,
    private userService: UserService
  ) {}
  
  /**
   * Get all stores with optional filtering
   */
  getStores(options: {
    skip?: number,
    limit?: number,
    name?: string,
    city?: string,
    manager_id?: string,
    is_active?: boolean
  } = {}): Observable<Store[]> {
    let params = new HttpParams();
    
    if (options.skip !== undefined) params = params.set('skip', options.skip.toString());
    if (options.limit !== undefined) params = params.set('limit', options.limit.toString());
    if (options.name) params = params.set('name', options.name);
    if (options.city) params = params.set('city', options.city);
    if (options.manager_id) params = params.set('manager_id', options.manager_id);
    if (options.is_active !== undefined) params = params.set('is_active', options.is_active.toString());
    
    return this.http.get<Store[]>(this.apiUrl, { params }).pipe(
      tap(stores => console.log(`Fetched ${stores.length} stores`)),
      switchMap(stores => this.enhanceStoresWithManagerInfo(stores)),
      catchError(this.handleError<Store[]>('getStores', []))
    );
  }
  
  /**
   * Get store by ID
   */
  getStoreById(id: string): Observable<Store> {
    const url = `${this.apiUrl}/${id}`;
    return this.http.get<Store>(url).pipe(
      tap(_ => console.log(`Fetched store id=${id}`)),
      switchMap(store => this.enhanceStoreWithManagerInfo(store)),
      catchError(this.handleError<Store>(`getStoreById id=${id}`))
    );
  }
  
  /**
   * Get stores by manager
   */
  getStoresByManager(managerId: string): Observable<Store[]> {
    return this.getStores({ manager_id: managerId });
  }
  
  /**
   * Create a new store
   */
  createStore(store: Partial<Store>): Observable<Store> {
    return this.http.post<Store>(this.apiUrl, store).pipe(
      tap((newStore: Store) => console.log(`Created store id=${newStore._id}`)),
      switchMap(store => this.enhanceStoreWithManagerInfo(store)),
      catchError(this.handleError<Store>('createStore'))
    );
  }
  
  /**
   * Update an existing store
   */
  updateStore(id: string, store: Partial<Store>): Observable<Store> {
    const url = `${this.apiUrl}/${id}`;
    return this.http.put<Store>(url, store).pipe(
      tap(_ => console.log(`Updated store id=${id}`)),
      switchMap(store => this.enhanceStoreWithManagerInfo(store)),
      catchError(this.handleError<Store>(`updateStore id=${id}`))
    );
  }
  
  /**
   * Delete a store
   */
  deleteStore(id: string): Observable<boolean> {
    const url = `${this.apiUrl}/${id}`;
    return this.http.delete<boolean>(url).pipe(
      tap(_ => console.log(`Deleted store id=${id}`)),
      catchError(this.handleError<boolean>(`deleteStore id=${id}`))
    );
  }
  
  /**
   * Assign manager to store
   */
  assignManager(storeId: string, managerId: string): Observable<Store> {
    return this.updateStore(storeId, { manager_id: managerId });
  }
  
  /**
   * Get stores filtered by active status
   */
  getActiveStores(): Observable<Store[]> {
    return this.getStores({ is_active: true });
  }
  
  /**
   * Helper method to enhance a store with manager information
   */
  private enhanceStoreWithManagerInfo(store: Store): Observable<Store> {
    if (!store.manager_id) {
      return of(store);
    }
    
    return this.userService.getUserById(store.manager_id).pipe(
      map(manager => {
        return {
          ...store,
          manager_name: manager.full_name
        };
      }),
      catchError(error => {
        console.error(`Error fetching manager info for store ${store._id}:`, error);
        return of(store);
      })
    );
  }
  
  /**
   * Helper method to enhance multiple stores with manager information
   */
  private enhanceStoresWithManagerInfo(stores: Store[]): Observable<Store[]> {
    if (stores.length === 0) {
      return of([]);
    }
    
    // Get unique manager IDs
    const managerIds = [...new Set(stores
      .filter(store => !!store.manager_id)
      .map(store => store.manager_id))];
    
    if (managerIds.length === 0) {
      return of(stores);
    }
    
    // Fetch all managers in one batch request
    const managerRequests = managerIds.map(id => 
      this.userService.getUserById(id as string).pipe(
        catchError(error => {
          console.error(`Error fetching manager info for ID ${id}:`, error);
          return of(null);
        })
      )
    );
    
    return forkJoin(managerRequests).pipe(
      map(managers => {
        // Create a map of manager IDs to names
        const managerMap = new Map();
        managers.forEach(manager => {
          if (manager) {
            managerMap.set(manager._id, manager.full_name);
          }
        });
        
        // Enhance each store with its manager's name
        return stores.map(store => {
          if (store.manager_id && managerMap.has(store.manager_id)) {
            return {
              ...store,
              manager_name: managerMap.get(store.manager_id)
            };
          }
          return store;
        });
      })
    );
  }
  
  /**
   * Handle Http operation that failed.
   * Let the app continue.
   * @param operation - name of the operation that failed
   * @param result - optional value to return as the observable result
   */
  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.error(`${operation} failed: ${error.message}`);
      
      // Let the app keep running by returning an empty result
      return of(result as T);
    };
  }
}