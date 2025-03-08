// src/app/core/services/role.service.ts
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { ApiService } from './api.service';
import { DataAccessService } from './data-access.service';
import { API_CONFIG } from '../config/api-config';
import { Role, RoleCreate, RoleUpdate } from '../../shared/models/role.model';

@Injectable({
  providedIn: 'root'
})
export class RoleService {
  private cacheKey = 'roles';
  
  constructor(
    private apiService: ApiService,
    private dataAccess: DataAccessService
  ) {}
  
  /**
   * Get all roles with optional filtering
   */
  getRoles(params?: {
    skip?: number;
    limit?: number;
    name?: string;
  }, refresh = false): Observable<Role[]> {
    return this.dataAccess.getData(
      this.cacheKey,
      () => this.apiService.get<Role[]>(API_CONFIG.roles.base, params),
      refresh
    );
  }
  
  /**
   * Get role by ID
   */
  getRole(id: string): Observable<Role> {
    return this.apiService.get<Role>(API_CONFIG.roles.getById(id));
  }
  
  /**
   * Create a new role
   */
  createRole(role: RoleCreate): Observable<Role> {
    return this.apiService.post<Role>(API_CONFIG.roles.base, role)
      .pipe(
        map(newRole => {
          // Update cache with new role
          this.updateRoleCache(newRole);
          return newRole;
        })
      );
  }
  
  /**
   * Update an existing role
   */
  updateRole(id: string, role: RoleUpdate): Observable<Role> {
    return this.apiService.put<Role>(API_CONFIG.roles.getById(id), role)
      .pipe(
        map(updatedRole => {
          // Update cache with updated role
          this.updateRoleCache(updatedRole);
          return updatedRole;
        })
      );
  }
  
  /**
   * Delete a role
   */
  deleteRole(id: string): Observable<boolean> {
    return this.apiService.delete<boolean>(API_CONFIG.roles.getById(id))
      .pipe(
        map(result => {
          if (result) {
            // Remove role from cache
            this.removeRoleFromCache(id);
          }
          return result;
        })
      );
  }
  
  /**
   * Update the cached roles list with a new or updated role
   */
  private updateRoleCache(role: Role): void {
    const cached = this.dataAccess.getData(
      this.cacheKey,
      () => this.apiService.get<Role[]>(API_CONFIG.roles.base)
    );
    
    cached.subscribe(roles => {
      if (roles) {
        // Find and replace or add the role
        const index = roles.findIndex(r => r._id === role._id);
        if (index >= 0) {
          roles[index] = role;
        } else {
          roles.push(role);
        }
        
        // Update cache
        this.dataAccess.updateData(this.cacheKey, roles);
      }
    });
  }
  
  /**
   * Remove a role from the cached roles list
   */
  private removeRoleFromCache(id: string): void {
    const cached = this.dataAccess.getData(
      this.cacheKey,
      () => this.apiService.get<Role[]>(API_CONFIG.roles.base)
    );
    
    cached.subscribe(roles => {
      if (roles) {
        // Filter out the deleted role
        const filtered = roles.filter(r => r._id !== id);
        
        // Update cache
        this.dataAccess.updateData(this.cacheKey, filtered);
      }
    });
  }
}