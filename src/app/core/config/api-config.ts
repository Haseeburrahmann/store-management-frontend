// src/app/core/config/api-config.ts

/**
 * Configuration for API service and caching
 */
export class ApiConfig {
    /**
     * Default timeout for API requests in milliseconds (30 seconds)
     */
    static defaultTimeout = 30000;
    
    /**
     * Default number of retries for failed requests
     */
    static defaultRetries = 1;
    
    /**
     * Maximum retry delay in milliseconds (10 seconds)
     */
    static maxRetryDelay = 10000;
    
    /**
     * API endpoints configuration
     */
    static endpoints = {
      auth: {
        login: '/auth/login',
        register: '/auth/register',
        refreshToken: '/auth/refresh',
        me: '/auth/me'
      },
      users: {
        base: '/users',
        detail: (id: string) => `/users/${id}`,
        profile: '/users/me'
      },
      roles: {
        base: '/roles',
        detail: (id: string) => `/roles/${id}`
      },
      stores: {
        base: '/stores',
        detail: (id: string) => `/stores/${id}`,
        assignManager: (id: string, managerId: string) => `/stores/${id}/assign-manager/${managerId}`
      },
      employees: {
        base: '/employees',
        detail: (id: string) => `/employees/${id}`,
        byStore: (storeId: string) => `/stores/${storeId}/employees`
      },
      hours: {
        base: '/hours',
        detail: (id: string) => `/hours/${id}`,
        clockIn: '/hours/clock-in',
        clockOut: '/hours/clock-out',
        approve: (id: string) => `/hours/${id}/approve`
      },
      inventory: {
        base: '/inventory',
        detail: (id: string) => `/inventory/${id}`,
        byStore: (storeId: string) => `/stores/${storeId}/inventory`
      },
      sales: {
        base: '/sales',
        detail: (id: string) => `/sales/${id}`,
        byStore: (storeId: string) => `/stores/${storeId}/sales`
      },
      reports: {
        sales: '/reports/sales',
        hours: '/reports/hours',
        inventory: '/reports/inventory',
        employees: '/reports/employees'
      }
    };
    
    /**
     * Cache configuration
     */
    static cache = {
      /**
       * Default time-to-live for cached responses in milliseconds (30 minutes)
       */
      defaultTTL: 30 * 60 * 1000,
      
      /**
       * Cache tags for different resource types
       */
      tags: {
        users: 'users',
        roles: 'roles',
        stores: 'stores',
        employees: 'employees',
        hours: 'hours',
        inventory: 'inventory',
        sales: 'sales',
        reports: 'reports'
      },
      
      /**
       * Endpoints that should never be cached
       */
      noCacheEndpoints: [
        '/auth/login',
        '/auth/register',
        '/auth/refresh',
        '/hours/clock-in',
        '/hours/clock-out'
      ],
      
      /**
       * Whether to enable debug logging for cache operations
       */
      enableLogging: false
    };
  }