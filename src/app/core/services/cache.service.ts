// src/app/core/services/cache.service.ts

import { Injectable } from '@angular/core';

export interface CacheOptions {
  /** Cache key */
  key: string;
  /** Time-to-live in milliseconds */
  ttl?: number;
  /** Tag for cache invalidation */
  tag?: string | string[];
}

export interface CacheEntry<T> {
  /** Cache key */
  key: string;
  /** Cached data */
  data: T;
  /** Expiration timestamp */
  expiry: number;
  /** Cache tags */
  tags: string[];
  /** Creation timestamp */
  created: number;
}

export class CacheConfig {
  /** Default time-to-live in milliseconds (30 minutes) */
  static defaultTTL = 30 * 60 * 1000;
  /** Whether to enable cache logging */
  static enableLogging = false;
  /** Maximum storage size in bytes (5MB) */
  static maxStorageSize = 5 * 1024 * 1024;
}

/**
 * Service for caching API responses and other data
 * Supports time-based expiration and tag-based invalidation
 */
@Injectable({
  providedIn: 'root'
})
export class CacheService {
  private cache = new Map<string, CacheEntry<any>>();
  private storageKey = 'app_cache';
  private persistentCacheEnabled = true;

  constructor() {
    this.loadFromStorage();
  }

  /**
   * Gets a value from the cache
   * 
   * @param key Cache key
   * @returns Cached value or null if not found or expired
   */
  get<T>(key: string): T | null {
    // Check memory cache first
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.log(`Cache miss: ${key}`);
      return null;
    }
    
    // Check if entry has expired
    if (entry.expiry < Date.now()) {
      this.log(`Cache expired: ${key}`);
      this.cache.delete(key);
      this.saveToStorage();
      return null;
    }
    
    this.log(`Cache hit: ${key}`);
    return entry.data as T;
  }

  /**
   * Sets a value in the cache
   * 
   * @param options Cache options
   * @param data Data to cache
   */
  set<T>(options: CacheOptions, data: T): void {
    const { key, ttl = CacheConfig.defaultTTL, tag } = options;
    const tags = this.normalizeTags(tag);
    
    const entry: CacheEntry<T> = {
      key,
      data,
      expiry: Date.now() + ttl,
      tags,
      created: Date.now()
    };
    
    this.cache.set(key, entry);
    this.log(`Cache set: ${key}, expires in ${ttl}ms`);
    
    this.saveToStorage();
  }

  /**
   * Checks if a key exists in the cache and is not expired
   * 
   * @param key Cache key
   * @returns True if key exists and is not expired
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return false;
    }
    
    // Check if entry has expired
    if (entry.expiry < Date.now()) {
      this.cache.delete(key);
      this.saveToStorage();
      return false;
    }
    
    return true;
  }

  /**
   * Removes a value from the cache
   * 
   * @param key Cache key
   */
  remove(key: string): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
      this.log(`Cache removed: ${key}`);
      this.saveToStorage();
    }
  }

  /**
   * Invalidates all cache entries with a specific tag
   * 
   * @param tag Cache tag
   */
  invalidateByTag(tag: string): void {
    let invalidatedCount = 0;
    
    this.cache.forEach((entry, key) => {
      if (entry.tags.includes(tag)) {
        this.cache.delete(key);
        invalidatedCount++;
      }
    });
    
    if (invalidatedCount > 0) {
      this.log(`Invalidated ${invalidatedCount} cache entries with tag: ${tag}`);
      this.saveToStorage();
    }
  }

  /**
   * Clears all cache entries
   */
  clear(): void {
    const size = this.cache.size;
    this.cache.clear();
    this.log(`Cache cleared: ${size} entries removed`);
    this.saveToStorage();
  }

  /**
   * Gets all cache keys
   * 
   * @returns Array of cache keys
   */
  getKeys(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * Gets the size of the cache in entries
   * 
   * @returns Number of cache entries
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Gets the approximate size of the cache in bytes
   * 
   * @returns Approximate size in bytes
   */
  sizeInBytes(): number {
    let size = 0;
    
    this.cache.forEach((entry) => {
      // Approximate size calculation based on JSON stringify
      size += JSON.stringify(entry).length * 2; // Unicode characters are 2 bytes
    });
    
    return size;
  }

  /**
   * Saves the cache to localStorage
   */
  private saveToStorage(): void {
    if (!this.persistentCacheEnabled) {
      return;
    }
    
    try {
      // Filter out expired entries
      const entries = Array.from(this.cache.values()).filter(entry => entry.expiry > Date.now());
      
      // Check if cache is too large
      const json = JSON.stringify(entries);
      
      if (json.length * 2 > CacheConfig.maxStorageSize) {
        console.warn(`Cache exceeds maximum size (${CacheConfig.maxStorageSize} bytes), not saving to storage`);
        return;
      }
      
      localStorage.setItem(this.storageKey, json);
    } catch (error) {
      console.error('Error saving cache to storage:', error);
    }
  }

  /**
   * Loads the cache from localStorage
   */
  private loadFromStorage(): void {
    if (!this.persistentCacheEnabled) {
      return;
    }
    
    try {
      const json = localStorage.getItem(this.storageKey);
      
      if (json) {
        const entries = JSON.parse(json) as CacheEntry<any>[];
        
        // Filter out expired entries
        const validEntries = entries.filter(entry => entry.expiry > Date.now());
        
        validEntries.forEach(entry => {
          this.cache.set(entry.key, entry);
        });
        
        this.log(`Loaded ${validEntries.length} cache entries from storage`);
        
        // If we filtered out any expired entries, save the updated cache
        if (validEntries.length !== entries.length) {
          this.saveToStorage();
        }
      }
    } catch (error) {
      console.error('Error loading cache from storage:', error);
    }
  }

  /**
   * Normalizes cache tags
   * 
   * @param tag Tag or tags
   * @returns Array of tags
   */
  private normalizeTags(tag?: string | string[]): string[] {
    if (!tag) {
      return [];
    }
    
    if (Array.isArray(tag)) {
      return tag;
    }
    
    return [tag];
  }

  /**
   * Logs cache operations if logging is enabled
   * 
   * @param message Log message
   */
  private log(message: string): void {
    if (CacheConfig.enableLogging) {
      console.log(`[Cache] ${message}`);
    }
  }
}