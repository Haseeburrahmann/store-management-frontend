// Updated cache-config.ts
export interface CacheEndpointConfig {
  lifetime?: number;
  cache?: boolean;
}

export const CACHE_CONFIG = {
  // Default cache lifetime in milliseconds
  defaultLifetime: 5 * 60 * 1000, // 5 minutes
  
  // Cache specific configurations by endpoint pattern
  endpoints: {
    '/api/v1/roles': {
      lifetime: 30 * 60 * 1000 // 30 minutes
    } as CacheEndpointConfig,
    '/api/v1/stores': {
      lifetime: 10 * 60 * 1000 // 10 minutes
    } as CacheEndpointConfig,
    '/api/v1/users/me': {
      cache: false
    } as CacheEndpointConfig,
    '/api/v1/hours': {
      cache: false
    } as CacheEndpointConfig
  } as Record<string, CacheEndpointConfig>,
  
  // Cache storage key
  storageKey: 'store_management_cache'
};