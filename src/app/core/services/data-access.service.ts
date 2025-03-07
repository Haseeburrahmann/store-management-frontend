// src/app/core/services/data-access.service.ts

import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpContext } from '@angular/common/http';
import { CACHE_TAGS, CACHE_TTL } from '../interceptors/cache.interceptor';

/**
 * Interface for pagination and metadata
 */
export interface PaginationMeta {
  pagination?: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

/**
 * Generic interface for API responses
 */
export interface ApiResponse<T> {
  data: T;
  meta?: PaginationMeta;
}

/**
 * Interface for data entities with standard fields
 */
export interface DataEntity {
  id: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Generic interface for list responses with pagination
 */
export interface DataList<T extends DataEntity> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  
  // Methods to make DataList compatible with T[]
  length?: number;
  filter?: (predicate: (value: T, index: number, array: T[]) => unknown) => T[];
  map?: <U>(callbackfn: (value: T, index: number, array: T[]) => U) => U[];
  find?: (predicate: (value: T, index: number, obj: T[]) => unknown) => T | undefined;
  some?: (predicate: (value: T, index: number, array: T[]) => unknown) => boolean;
}

/**
 * Common query parameters for list endpoints
 */
export interface QueryParams {
  page?: number;
  pageSize?: number;
  search?: string;
  sort_by?: string;
  sort_dir?: 'asc' | 'desc';
  [key: string]: any;
}

/**
 * Helper service for data access patterns
 */
@Injectable({
  providedIn: 'root'
})
export class DataAccessService {
  constructor() {}

  /**
   * Transforms response data to a standardized DataList format
   * 
   * @param response API response
   * @param queryParams Query parameters used in the request
   * @returns Standardized data list
   */
  transformToDataList<T extends DataEntity>(
    response: any, 
    queryParams: Record<string, any>
  ): DataList<T> {
    // Extract the data array
    const dataArray: T[] = Array.isArray(response) 
      ? response 
      : (response.data || []);
    
    // Parse pagination information
    const page = parseInt(queryParams['page'] || '1', 10);
    const pageSize = parseInt(queryParams['page_size'] || '10', 10);
    const total = response.meta?.pagination?.total || dataArray.length;
    const totalPages = response.meta?.pagination?.totalPages || 
                      Math.ceil(total / pageSize);
    
    // Create the result object
    const result: DataList<T> = {
      data: dataArray,
      total,
      page,
      pageSize,
      totalPages
    };
    
    // Add array-like methods to make DataList compatible with T[]
    result.length = dataArray.length;
    result.filter = (predicate) => dataArray.filter(predicate);
    result.map = (callback) => dataArray.map(callback);
    result.find = (predicate) => dataArray.find(predicate);
    result.some = (predicate) => dataArray.some(predicate);
    
    return result;
  }
  
  /**
   * Creates HTTP context with cache tags and TTL
   * 
   * @param tags Cache tags
   * @param ttl Cache TTL in milliseconds
   * @returns HTTP context
   */
  createCacheContext(tags: string[], ttl: number): HttpContext {
    return new HttpContext()
      .set(CACHE_TAGS, tags)
      .set(CACHE_TTL, ttl);
  }
  
  /**
   * Builds query parameters object from a QueryParams object
   * 
   * @param params Query parameters
   * @returns Record with string values
   */
  buildQueryParams(params: QueryParams): Record<string, string> {
    const result: Record<string, string> = {};
    
    // Add pagination parameters
    if (params.page !== undefined) {
      result['page'] = params.page.toString();
    }
    
    if (params.pageSize !== undefined) {
      result['page_size'] = params.pageSize.toString();
    }
    
    // Add sorting parameters
    if (params.sort_by) {
      result['sort_by'] = params.sort_by;
    }
    
    if (params.sort_dir) {
      result['sort_dir'] = params.sort_dir;
    }
    
    // Add search parameter
    if (params.search) {
      result['search'] = params.search;
    }
    
    // Add all other parameters
    Object.entries(params).forEach(([key, value]) => {
      // Skip already handled parameters
      if (['page', 'pageSize', 'sort_by', 'sort_dir', 'search'].includes(key)) {
        return;
      }
      
      // Skip undefined or null values
      if (value === undefined || value === null) {
        return;
      }
      
      // Handle different types
      if (typeof value === 'boolean' || typeof value === 'number') {
        result[key] = value.toString();
      } else if (typeof value === 'string') {
        result[key] = value;
      } else if (Array.isArray(value)) {
        result[key] = value.join(',');
      } else if (value instanceof Date) {
        result[key] = value.toISOString();
      } else if (typeof value === 'object') {
        result[key] = JSON.stringify(value);
      }
    });
    
    return result;
  }
}