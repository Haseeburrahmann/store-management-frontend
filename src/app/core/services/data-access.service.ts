// src/app/core/services/data-access.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

/**
 * A generic service for caching and managing data
 * This is useful for sharing data between components without making repeated API calls
 */
@Injectable({
  providedIn: 'root'
})
export class DataAccessService {
  private cache = new Map<string, BehaviorSubject<any>>();
  
  constructor() {}
  
  /**
   * Get data from cache or fetch it using the provided fetcher function
   * @param key Cache key
   * @param fetcher Function to fetch data if not in cache
   * @param refresh Force refresh data from fetcher
   */
  getData<T>(key: string, fetcher: () => Observable<T>, refresh = false): Observable<T> {
    // If not in cache or refresh is true, fetch data
    if (!this.cache.has(key) || refresh) {
      // Create a new subject if it doesn't exist
      if (!this.cache.has(key)) {
        this.cache.set(key, new BehaviorSubject<T | null>(null));
      }
      
      // Fetch data and update cache
      fetcher().pipe(
        tap(data => {
          const subject = this.cache.get(key);
          if (subject) {
            subject.next(data);
          }
        })
      ).subscribe();
    }
    
    // Return the cached observable
    return this.cache.get(key)!.asObservable();
  }
  
  /**
   * Update data in cache
   * @param key Cache key
   * @param data New data
   */
  updateData<T>(key: string, data: T): void {
    if (!this.cache.has(key)) {
      this.cache.set(key, new BehaviorSubject<T>(data));
    } else {
      const subject = this.cache.get(key);
      if (subject) {
        subject.next(data);
      }
    }
  }
  
  /**
   * Clear data from cache
   * @param key Cache key
   */
  clearData(key: string): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }
  }
  
  /**
   * Clear all cache
   */
  clearAllData(): void {
    this.cache.clear();
  }
}