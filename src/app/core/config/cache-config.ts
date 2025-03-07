// src/app/core/config/cache-config.ts

/**
 * Configuration for the cache service
 */
export class CacheConfig {
    /**
     * Default time-to-live in milliseconds (30 minutes)
     */
    static defaultTTL = 30 * 60 * 1000;
    
    /**
     * Whether to enable cache logging
     */
    static enableLogging = false;
    
    /**
     * Maximum storage size in bytes (5MB)
     */
    static maxStorageSize = 5 * 1024 * 1024;
    
    /**
     * Cache keys for specific resources
     */
    static keys = {
      user: 'user',
      roles: 'roles',
      stores: 'stores',
      storesList: 'stores-list',
      employees: 'employees',
      employeesList: 'employees-list',
      inventoryItems: 'inventory-items',
      sales: 'sales'
    };
    
    /**
     * Cache tags for invalidation
     */
    static tags = {
      auth: 'auth',
      users: 'users',
      roles: 'roles',
      stores: 'stores',
      employees: 'employees',
      hours: 'hours',
      inventory: 'inventory',
      sales: 'sales',
      reports: 'reports'
    };
    
    /**
     * TTL settings for different resource types (in milliseconds)
     */
    static ttl = {
      user: 10 * 60 * 1000, // 10 minutes
      roles: 60 * 60 * 1000, // 1 hour
      stores: 30 * 60 * 1000, // 30 minutes
      employees: 30 * 60 * 1000, // 30 minutes
      inventory: 15 * 60 * 1000, // 15 minutes
      sales: 15 * 60 * 1000, // 15 minutes
      reports: 15 * 60 * 1000 // 15 minutes
    };
    
    /**
     * Cache invalidation rules
     * Maps actions to tags that should be invalidated
     */
    static invalidationRules = {
      'user:create': [CacheConfig.tags.users],
      'user:update': [CacheConfig.tags.users],
      'user:delete': [CacheConfig.tags.users],
      
      'role:create': [CacheConfig.tags.roles, CacheConfig.tags.users],
      'role:update': [CacheConfig.tags.roles, CacheConfig.tags.users],
      'role:delete': [CacheConfig.tags.roles, CacheConfig.tags.users],
      
      'store:create': [CacheConfig.tags.stores],
      'store:update': [CacheConfig.tags.stores],
      'store:delete': [CacheConfig.tags.stores],
      'store:assignManager': [CacheConfig.tags.stores, CacheConfig.tags.users],
      
      'employee:create': [CacheConfig.tags.employees, CacheConfig.tags.stores],
      'employee:update': [CacheConfig.tags.employees, CacheConfig.tags.stores],
      'employee:delete': [CacheConfig.tags.employees, CacheConfig.tags.stores],
      
      'hours:create': [CacheConfig.tags.hours, CacheConfig.tags.employees],
      'hours:update': [CacheConfig.tags.hours, CacheConfig.tags.employees],
      'hours:delete': [CacheConfig.tags.hours, CacheConfig.tags.employees],
      'hours:approve': [CacheConfig.tags.hours, CacheConfig.tags.employees],
      
      'inventory:create': [CacheConfig.tags.inventory, CacheConfig.tags.stores],
      'inventory:update': [CacheConfig.tags.inventory, CacheConfig.tags.stores],
      'inventory:delete': [CacheConfig.tags.inventory, CacheConfig.tags.stores],
      
      'sales:create': [CacheConfig.tags.sales, CacheConfig.tags.stores, CacheConfig.tags.reports],
      'sales:update': [CacheConfig.tags.sales, CacheConfig.tags.stores, CacheConfig.tags.reports],
      'sales:delete': [CacheConfig.tags.sales, CacheConfig.tags.stores, CacheConfig.tags.reports]
    };
  }