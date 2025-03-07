// src/app/core/interceptors/cache.interceptor.ts

import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpResponse,
  HttpContextToken
} from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { CacheService, CacheConfig } from '../services/cache.service';

/**
 * HTTP context token to control cache behavior for a request
 */
export const CACHE_RESPONSE = new HttpContextToken<boolean>(() => true);

/**
 * HTTP context token to set cache TTL for a request
 */
export const CACHE_TTL = new HttpContextToken<number>(() => CacheConfig.defaultTTL);

/**
 * HTTP context token to set cache tags for a request
 */
export const CACHE_TAGS = new HttpContextToken<string[]>(() => []);

/**
 * HTTP interceptor for caching GET requests
 */
@Injectable()
export class CacheInterceptor implements HttpInterceptor {

  constructor(private cacheService: CacheService) {}

  /**
   * Intercepts HTTP requests and caches GET responses
   * 
   * @param request The HTTP request
   * @param next The next HTTP handler
   * @returns An Observable of the HTTP event
   */
  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // Only cache GET requests
    if (request.method !== 'GET') {
      return next.handle(request);
    }
    
    // Check if caching is disabled for this request
    if (!request.context.get(CACHE_RESPONSE)) {
      return next.handle(request);
    }
    
    // Generate cache key based on URL and query parameters
    const cacheKey = this.generateCacheKey(request);
    
    // Check for cached response
    const cachedResponse = this.cacheService.get<HttpResponse<any>>(cacheKey);
    
    if (cachedResponse) {
      // Return cached response as an observable
      return of(cachedResponse);
    }
    
    // No cached response exists or it expired, proceed with request
    return next.handle(request).pipe(
      tap(event => {
        // Only cache successful responses
        if (event instanceof HttpResponse) {
          const ttl = request.context.get(CACHE_TTL);
          const tags = request.context.get(CACHE_TAGS);
          
          this.cacheService.set(
            { key: cacheKey, ttl, tag: tags },
            event
          );
        }
      })
    );
  }

  /**
   * Generates a cache key for an HTTP request
   * 
   * @param request The HTTP request
   * @returns The cache key
   */
  private generateCacheKey(request: HttpRequest<any>): string {
    // Create a key from the request URL and sorted query parameters
    const url = request.urlWithParams;
    
    // For API requests, strip out any query params that would make
    // the response uncacheable (e.g., timestamps, random values)
    const parsedUrl = new URL(url, window.location.origin);
    
    // Remove specified non-cacheable parameters
    const nonCacheableParams = ['timestamp', 'random', 'nocache'];
    nonCacheableParams.forEach(param => {
      parsedUrl.searchParams.delete(param);
    });
    
    // Sort remaining parameters to ensure consistent cache keys
    const sortedParams: [string, string][] = [];
    parsedUrl.searchParams.forEach((value, key) => {
      sortedParams.push([key, value]);
    });
    sortedParams.sort((a, b) => a[0].localeCompare(b[0]));
    
    // Create new search params object with sorted parameters
    const newSearchParams = new URLSearchParams();
    sortedParams.forEach(([key, value]) => {
      newSearchParams.append(key, value);
    });
    
    // Build final cache key
    const baseUrl = parsedUrl.pathname;
    const queryString = newSearchParams.toString();
    const cacheKey = queryString ? `${baseUrl}?${queryString}` : baseUrl;
    
    return `http_cache:${cacheKey}`;
  }
}