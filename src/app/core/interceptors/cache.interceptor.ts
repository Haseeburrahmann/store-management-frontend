// src/app/core/interceptors/cache.interceptor.ts
import { HttpInterceptorFn } from '@angular/common/http';
import { of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { CACHE_CONFIG } from '../config/cache-config';

// Cache storage
const cache = new Map<string, { response: any, timestamp: number }>();

export const cacheInterceptor: HttpInterceptorFn = (req, next) => {
  // Don't cache non-GET requests
  if (req.method !== 'GET') {
    return next(req);
  }

  // Check if this endpoint should be cached
  const shouldCache = shouldCacheRequest(req.url);
  if (!shouldCache) {
    return next(req);
  }

  // Check if we have a cached response
  const cachedResponse = getFromCache(req.url);
  if (cachedResponse) {
    return of(cachedResponse);
  }

  // No cache hit, proceed with request and cache the response
  return next(req).pipe(
    tap(event => {
      if (event.type === 0) { // HttpEventType.Response = 4
        addToCache(req.url, event);
      }
    })
  );
};

// Helper functions
function shouldCacheRequest(url: string): boolean {
  // Check if any specific endpoint config exists
  for (const endpoint in CACHE_CONFIG.endpoints) {
    if (url.includes(endpoint)) {
      return CACHE_CONFIG.endpoints[endpoint].cache !== false;
    }
  }
  
  // Default to true for GET requests
  return true;
}

function getCacheLifetime(url: string): number {
  // Check if any specific endpoint config exists
  for (const endpoint in CACHE_CONFIG.endpoints) {
    if (url.includes(endpoint) && CACHE_CONFIG.endpoints[endpoint].lifetime) {
      return CACHE_CONFIG.endpoints[endpoint].lifetime!;
    }
  }
  
  // Default lifetime
  return CACHE_CONFIG.defaultLifetime;
}

function getFromCache(url: string): any | null {
  const cached = cache.get(url);
  if (!cached) {
    return null;
  }

  const now = new Date().getTime();
  const lifetime = getCacheLifetime(url);
  
  if (now - cached.timestamp > lifetime) {
    // Cache entry has expired
    cache.delete(url);
    return null;
  }

  return cached.response;
}

function addToCache(url: string, response: any): void {
  const entry = {
    response,
    timestamp: new Date().getTime()
  };
  
  cache.set(url, entry);
}