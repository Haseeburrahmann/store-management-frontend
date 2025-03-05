// src/app/core/services/user.service.ts

import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { User, UserCreate, UserUpdate, UserResponse } from '../auth/models/user.model';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private endpoint = '/users';

  constructor(private apiService: ApiService) { }

  /**
   * Get a paginated list of users
   * @param skip Number of items to skip
   * @param limit Maximum number of items to return
   * @param search Optional search term
   * @returns Observable of User array
   */
  getUsers(skip: number = 0, limit: number = 10, search?: string): Observable<User[]> {
    const params = this.apiService.buildParams({
      skip,
      limit,
      search
    });
    
    return this.apiService.get<User[]>(this.endpoint, params);
  }

  /**
   * Get a specific user by ID
   * @param id User ID
   * @returns Observable of User
   */
  getUser(id: string): Observable<User> {
    return this.apiService.get<UserResponse>(`${this.endpoint}/${id}`).pipe(
      map(response => this.formatUserResponse(response))
    );
  }

  /**
   * Create a new user
   * @param userData User data
   * @returns Observable of created User
   */
  createUser(userData: UserCreate): Observable<User> {
    return this.apiService.post<UserResponse>(this.endpoint, userData).pipe(
      map(response => this.formatUserResponse(response))
    );
  }

  /**
   * Update an existing user
   * @param id User ID
   * @param userData User update data
   * @returns Observable of updated User
   */
  updateUser(id: string, userData: UserUpdate): Observable<User> {
    return this.apiService.put<UserResponse>(`${this.endpoint}/${id}`, userData).pipe(
      map(response => this.formatUserResponse(response))
    );
  }

  /**
   * Delete a user
   * @param id User ID
   * @returns Observable of void
   */
  deleteUser(id: string): Observable<void> {
    return this.apiService.delete<void>(`${this.endpoint}/${id}`);
  }

  /**
   * Get the current authenticated user
   * @returns Observable of User
   */
  getCurrentUser(): Observable<User> {
    return this.apiService.get<UserResponse>(`${this.endpoint}/me`).pipe(
      map(response => this.formatUserResponse(response))
    );
  }

  /**
   * Update the current authenticated user
   * @param userData User update data
   * @returns Observable of updated User
   */
  updateCurrentUser(userData: UserUpdate): Observable<User> {
    return this.apiService.put<UserResponse>(`${this.endpoint}/me`, userData).pipe(
      map(response => this.formatUserResponse(response))
    );
  }

  /**
   * Format the user response to ensure consistent structure
   * @param user User response from API
   * @returns Formatted User object
   */
  private formatUserResponse(user: UserResponse): User {
    // Ensure all IDs are strings
    return {
      ...user,
      _id: user._id.toString(),
      role_id: user.role_id ? user.role_id.toString() : undefined
    };
  }
}