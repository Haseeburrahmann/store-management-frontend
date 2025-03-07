// src/app/core/services/user.service.ts

import { Injectable } from '@angular/core';
import { Observable, throwError, of } from 'rxjs';
import { catchError, map, shareReplay, tap } from 'rxjs/operators';
import { HttpContext } from '@angular/common/http';

import { ApiService } from './api.service';
import { CacheService } from './cache.service';
import { ErrorService } from './error.service';
import { ApiConfig } from '../config/api-config';
import { CacheConfig } from '../config/cache-config';
import { CACHE_TAGS, CACHE_TTL } from '../interceptors/cache.interceptor';
import { createAppError, ErrorType } from '../utils/error-handler';

export interface User {
  id: string;
  email: string;
  full_name: string;
  phone_number?: string;
  role_id?: string;
  role?: {
    id: string;
    name: string;
    permissions?: string[];
  };
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserCreate {
  email: string;
  password: string;
  full_name: string;
  phone_number?: string;
  role_id?: string;
  is_active?: boolean;
}

export interface UserUpdate {
  full_name?: string;
  phone_number?: string;
  email?: string;
  role_id?: string;
  is_active?: boolean;
}

export interface UserQueryParams {
  page?: number;
  pageSize?: number;
  search?: string;
  role_id?: string;
  is_active?: boolean;
  sort_by?: string;
  sort_dir?: 'asc' | 'desc';
}

export interface UserList {
  data: User[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  
  // Added methods to make UserList compatible with User[]
  filter?: (predicate: (value: User, index: number, array: User[]) => unknown) => User[];
  length?: number;
}

/**
 * Enhanced User Service with caching and error handling
 */
@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly baseUrl = ApiConfig.endpoints.users.base;
  private readonly cacheKey = CacheConfig.keys.user;
  private readonly cacheTags = [CacheConfig.tags.users];
  private readonly cacheTTL = CacheConfig.ttl.user;

  constructor(
    private apiService: ApiService,
    private cacheService: CacheService,
    private errorService: ErrorService
  ) {}

  /**
   * Gets a list of users with pagination and filtering
   * 
   * @param params Query parameters
   * @returns Observable of user list
   */
  getUsers(params: UserQueryParams = {}): Observable<UserList> {
    const queryParams: Record<string, any> = {
      page: params.page?.toString() || '1',
      page_size: params.pageSize?.toString() || '10'
    };

    // Add optional parameters if provided
    if (params.search) queryParams['search'] = params.search;
    if (params.role_id) queryParams['role_id'] = params.role_id;
    if (params.is_active !== undefined) queryParams['is_active'] = params.is_active.toString();
    if (params.sort_by) queryParams['sort_by'] = params.sort_by;
    if (params.sort_dir) queryParams['sort_dir'] = params.sort_dir;

    // Create cache context with appropriate tags and TTL
    const context = new HttpContext()
      .set(CACHE_TAGS, this.cacheTags)
      .set(CACHE_TTL, this.cacheTTL);

    return this.apiService.get<UserList>(this.baseUrl, {
      params: queryParams,
      context
    }).pipe(
      map(response => {
        // Assuming the API returns a structure with data and pagination
        const result: UserList = {
          data: Array.isArray(response) ? response : (response as any).data || [],
          total: (response as any).meta?.pagination?.total || 
                 (Array.isArray(response) ? response.length : (response as any).data?.length || 0),
          page: parseInt(queryParams['page'], 10),
          pageSize: parseInt(queryParams['page_size'], 10),
          totalPages: (response as any).meta?.pagination?.totalPages || 
                      Math.ceil(((response as any).meta?.pagination?.total || 
                      (Array.isArray(response) ? response.length : (response as any).data?.length || 0)) / 
                      parseInt(queryParams['page_size'], 10))
        };
        
        // Add array-like methods to make UserList compatible with User[]
        const data = result.data;
        result.length = data.length;
        result.filter = (predicate) => data.filter(predicate);
        
        return result;
      }),
      catchError(error => {
        this.errorService.logError(error, { 
          context: 'UserService.getUsers', 
          params 
        });
        return throwError(() => error);
      }),
      shareReplay(1)
    );
  }

  /**
   * Gets a user by ID
   * 
   * @param id User ID
   * @returns Observable of user
   */
  getUser(id: string): Observable<User> {
    const url = ApiConfig.endpoints.users.detail(id);
    const cacheKey = `${this.cacheKey}_${id}`;
    
    // Check cache first
    const cachedUser = this.cacheService.get<User>(cacheKey);
    if (cachedUser) {
      return of(cachedUser);
    }

    // Create cache context with appropriate tags and TTL
    const context = new HttpContext()
      .set(CACHE_TAGS, this.cacheTags)
      .set(CACHE_TTL, this.cacheTTL);

    return this.apiService.get<User>(url, { context }).pipe(
      tap(user => {
        // Cache the result
        this.cacheService.set(
          { key: cacheKey, ttl: this.cacheTTL, tag: this.cacheTags },
          user
        );
      }),
      catchError(error => {
        this.errorService.logError(error, { 
          context: 'UserService.getUser', 
          userId: id 
        });
        
        if (error.type === ErrorType.NOT_FOUND) {
          return throwError(() => createAppError({
            type: ErrorType.NOT_FOUND,
            message: `User with ID ${id} not found.`
          }));
        }
        
        return throwError(() => error);
      }),
      shareReplay(1)
    );
  }

  /**
   * Creates a new user
   * 
   * @param user User data
   * @returns Observable of created user
   */
  createUser(user: UserCreate): Observable<User> {
    return this.apiService.post<User>(this.baseUrl, user).pipe(
      tap(_ => {
        // Invalidate cache
        this.cacheService.invalidateByTag(CacheConfig.tags.users);
      }),
      catchError(error => {
        this.errorService.logError(error, { 
          context: 'UserService.createUser',
          userData: { ...user, password: '[REDACTED]' }
        });
        
        // Handle specific validation errors
        if (error.type === ErrorType.VALIDATION) {
          return throwError(() => error);
        }
        
        return throwError(() => error);
      })
    );
  }

  /**
   * Updates a user
   * 
   * @param id User ID
   * @param user User data
   * @returns Observable of updated user
   */
  updateUser(id: string, user: UserUpdate): Observable<User> {
    const url = ApiConfig.endpoints.users.detail(id);
    const cacheKey = `${this.cacheKey}_${id}`;

    return this.apiService.put<User>(url, user).pipe(
      tap(updatedUser => {
        // Update cache
        this.cacheService.set(
          { key: cacheKey, ttl: this.cacheTTL, tag: this.cacheTags },
          updatedUser
        );
        
        // Invalidate related caches
        this.cacheService.invalidateByTag(CacheConfig.tags.users);
      }),
      catchError(error => {
        this.errorService.logError(error, { 
          context: 'UserService.updateUser',
          userId: id,
          userData: user
        });
        
        if (error.type === ErrorType.NOT_FOUND) {
          return throwError(() => createAppError({
            type: ErrorType.NOT_FOUND,
            message: `User with ID ${id} not found.`
          }));
        }
        
        return throwError(() => error);
      })
    );
  }

  /**
   * Deletes a user
   * 
   * @param id User ID
   * @returns Observable of operation success
   */
  deleteUser(id: string): Observable<void> {
    const url = ApiConfig.endpoints.users.detail(id);
    const cacheKey = `${this.cacheKey}_${id}`;

    return this.apiService.delete<void>(url).pipe(
      tap(_ => {
        // Remove from cache
        this.cacheService.remove(cacheKey);
        
        // Invalidate related caches
        this.cacheService.invalidateByTag(CacheConfig.tags.users);
      }),
      catchError(error => {
        this.errorService.logError(error, { 
          context: 'UserService.deleteUser',
          userId: id
        });
        
        if (error.type === ErrorType.NOT_FOUND) {
          return throwError(() => createAppError({
            type: ErrorType.NOT_FOUND,
            message: `User with ID ${id} not found.`
          }));
        }
        
        return throwError(() => error);
      })
    );
  }

  /**
   * Gets the current user's profile
   * 
   * @returns Observable of the current user
   */
  getCurrentUser(): Observable<User> {
    const url = ApiConfig.endpoints.users.profile;
    const cacheKey = `${this.cacheKey}_current`;
    
    // Check cache first
    const cachedUser = this.cacheService.get<User>(cacheKey);
    if (cachedUser) {
      return of(cachedUser);
    }

    return this.apiService.get<User>(url).pipe(
      tap(user => {
        // Cache the result
        this.cacheService.set(
          { key: cacheKey, ttl: this.cacheTTL, tag: this.cacheTags },
          user
        );
      }),
      catchError(error => {
        this.errorService.logError(error, { 
          context: 'UserService.getCurrentUser'
        });
        return throwError(() => error);
      }),
      shareReplay(1)
    );
  }

  /**
   * Updates the current user's profile
   * 
   * @param user User update data
   * @returns Observable of updated user
   */
  updateCurrentUser(user: UserUpdate): Observable<User> {
    const url = ApiConfig.endpoints.users.profile;
    const cacheKey = `${this.cacheKey}_current`;

    return this.apiService.put<User>(url, user).pipe(
      tap(updatedUser => {
        // Update cache
        this.cacheService.set(
          { key: cacheKey, ttl: this.cacheTTL, tag: this.cacheTags },
          updatedUser
        );
      }),
      catchError(error => {
        this.errorService.logError(error, { 
          context: 'UserService.updateCurrentUser',
          userData: user
        });
        return throwError(() => error);
      })
    );
  }

  /**
   * Activates or deactivates a user
   * 
   * @param id User ID
   * @param active Whether to activate or deactivate
   * @returns Observable of updated user
   */
  setUserActive(id: string, active: boolean): Observable<User> {
    return this.updateUser(id, { is_active: active });
  }

  /**
   * Clears the user cache
   */
  clearCache(): void {
    this.cacheService.invalidateByTag(CacheConfig.tags.users);
  }
}