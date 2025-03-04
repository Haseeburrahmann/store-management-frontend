// src/app/core/services/store.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Store, StoreCreate, StoreUpdate } from '../../../shared/models/store.model';

@Injectable({
  providedIn: 'root'
})
export class StoreService {
  private apiUrl = `${environment.apiUrl}/stores`;

  constructor(private http: HttpClient) { }

  getStores(
    skip: number = 0, 
    limit: number = 10, 
    name?: string, 
    city?: string, 
    manager_id?: string
  ): Observable<Store[]> {
    let url = `${this.apiUrl}?skip=${skip}&limit=${limit}`;
    
    if (name) url += `&name=${name}`;
    if (city) url += `&city=${city}`;
    if (manager_id) url += `&manager_id=${manager_id}`;
    
    // Add a refresh timestamp to force reload and prevent caching
    url += `&_t=${new Date().getTime()}`;
    
    return this.http.get<Store[]>(url).pipe(
      tap(stores => console.log('Fetched stores:', stores))
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