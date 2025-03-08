// src/app/core/services/user.service.ts
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { ApiService } from './api.service';
import { DataAccessService } from './data-access.service';
import { API_CONFIG } from '../config/api-config';
import { User, UserCreate, UserUpdate } from '../../shared/models/user.model';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private cacheKey = 'users';
  
  constructor(
    private apiService: ApiService,
    private dataAccess: DataAccessService
  ) {}
  
  /**
   * Get all users with optional filtering
   */
  getUsers(params?: {
    skip?: number;
    limit?: number;
    email?: string;
    role_id?: string;
  }, refresh = false): Observable<User[]> {
    return this.dataAccess.getData(
      this.cacheKey,
      () => this.apiService.get<User[]>(API_CONFIG.users.base, params),
      refresh
    );
  }
  
  /**
   * Get current user profile
   */
  getCurrentUser(refresh = false): Observable<User> {
    return this.dataAccess.getData(
      `${this.cacheKey}_current`,
      () => this.apiService.get<User>(API_CONFIG.users.me),
      refresh
    );
  }
  
  /**
   * Get user by ID
   */
  getUser(id: string): Observable<User> {
    return this.apiService.get<User>(API_CONFIG.users.getById(id));
  }
  
  /**
   * Create a new user
   */
  createUser(user: UserCreate): Observable<User> {
    return this.apiService.post<User>(API_CONFIG.users.base, user)
      .pipe(
        map(newUser => {
          // Update cache with new user
          this.updateUserCache(newUser);
          return newUser;
        })
      );
  }
  
  /**
   * Update an existing user
   */
  updateUser(id: string, user: UserUpdate): Observable<User> {
    return this.apiService.put<User>(API_CONFIG.users.getById(id), user)
      .pipe(
        map(updatedUser => {
          // Update cache with updated user
          this.updateUserCache(updatedUser);
          return updatedUser;
        })
      );
  }
  
  /**
   * Delete a user
   */
  deleteUser(id: string): Observable<boolean> {
    return this.apiService.delete<boolean>(API_CONFIG.users.getById(id))
      .pipe(
        map(result => {
          if (result) {
            // Remove user from cache
            this.removeUserFromCache(id);
          }
          return result;
        })
      );
  }
  
  /**
   * Update the cached users list with a new or updated user
   */
  private updateUserCache(user: User): void {
    const cached = this.dataAccess.getData(
      this.cacheKey,
      () => this.apiService.get<User[]>(API_CONFIG.users.base)
    );
    
    cached.subscribe(users => {
      if (users) {
        // Find and replace or add the user
        const index = users.findIndex(u => u._id === user._id);
        if (index >= 0) {
          users[index] = user;
        } else {
          users.push(user);
        }
        
        // Update cache
        this.dataAccess.updateData(this.cacheKey, users);
      }
    });
  }
  
  /**
   * Remove a user from the cached users list
   */
  private removeUserFromCache(id: string): void {
    const cached = this.dataAccess.getData(
      this.cacheKey,
      () => this.apiService.get<User[]>(API_CONFIG.users.base)
    );
    
    cached.subscribe(users => {
      if (users) {
        // Filter out the deleted user
        const filtered = users.filter(u => u._id !== id);
        
        // Update cache
        this.dataAccess.updateData(this.cacheKey, filtered);
      }
    });
  }
}