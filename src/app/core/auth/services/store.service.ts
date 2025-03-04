// src/app/core/services/store.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map, Observable, tap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Store, StoreCreate, StoreUpdate } from '../../../shared/models/store.model';

@Injectable({
  providedIn: 'root'
})
export class StoreService {
  private apiUrl = `${environment.apiUrl}/stores`;

  constructor(private http: HttpClient) { }

  // Your store service might need fixing like this:
 // In store.service.ts
// src/app/core/services/store.service.ts
// src/app/core/services/store.service.ts
getStores(search?: number, status?: number, skip?: string, limit?: string): Observable<any[]> {
  let params = new HttpParams();
  
  // Add params as needed...
  
  return this.http.get<any[]>(`${this.apiUrl}`, { params }).pipe(
    tap(response => console.log('Raw API response:', response)),
    map(stores => {
      return stores.map(store => {
        // Log each store to see what ID format they have
        console.log('Processing store:', store);
        // Make sure each store has an _id
        return {
          ...store,
          // If the ID is missing, try to extract it
          _id: store._id || store.id || (typeof store === 'object' && store !== null && '_id' in store ? store._id : '')
        };
      });
    }),
    tap(stores => console.log('Processed stores:', stores))
  );
}

  getStore(id: string): Observable<Store> {
    return this.http.get<Store>(`${this.apiUrl}/${id}`);
  }

  createStore(store: StoreCreate): Observable<Store> {
    return this.http.post<Store>(this.apiUrl, store);
  }

  updateStore(id: string, store: StoreUpdate): Observable<Store> {
    return this.http.put<Store>(`${this.apiUrl}/${id}`, store);
  }

  deleteStore(id: string): Observable<boolean> {
    return this.http.delete<boolean>(`${this.apiUrl}/${id}`);
  }

  // In your store.service.ts
  // src/app/core/auth/services/store.service.ts
assignManager(storeId: string, managerId: string): Observable<any> {
    const url = `${this.apiUrl}/${storeId}/assign-manager/${managerId}`;
    console.log('Assign manager URL:', url);
    
    return this.http.put<any>(url, {}).pipe(
      tap(response => console.log('Assign manager response:', response))
    );
  }
  
  

  getManagedStores(): Observable<Store[]> {
    return this.http.get<Store[]>(`${this.apiUrl}/managed`);
  }
}