// src/app/core/services/role.service.ts

import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Role, RoleCreate, RoleUpdate, RoleResponse } from '../../shared/models/role.model';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class RoleService {
  private endpoint = '/roles';

  constructor(private apiService: ApiService) { }

  /**
   * Get a paginated list of roles
   * @param skip Number of items to skip
   * @param limit Maximum number of items to return
   * @returns Observable of Role array
   */
  getRoles(skip: number = 0, limit: number = 10): Observable<Role[]> {
    const params = this.apiService.buildParams({ skip, limit });
    
    return this.apiService.get<RoleResponse[]>(this.endpoint, params).pipe(
      map(roles => roles.map(role => this.formatRoleResponse(role)))
    );
  }

  /**
   * Get a specific role by ID
   * @param id Role ID
   * @returns Observable of Role
   */
  getRole(id: string): Observable<Role> {
    return this.apiService.get<RoleResponse>(`${this.endpoint}/${id}`).pipe(
      map(response => this.formatRoleResponse(response))
    );
  }

  /**
   * Create a new role
   * @param roleData Role creation data
   * @returns Observable of created Role
   */
  createRole(roleData: RoleCreate): Observable<Role> {
    // Normalize permissions for backend
    const normalizedData = {
      ...roleData,
      permissions: this.normalizePermissionsForBackend(roleData.permissions)
    };
    
    return this.apiService.post<RoleResponse>(this.endpoint, normalizedData).pipe(
      map(response => this.formatRoleResponse(response))
    );
  }

  /**
   * Update an existing role
   * @param id Role ID
   * @param roleData Role update data
   * @returns Observable of updated Role
   */
  updateRole(id: string, roleData: RoleUpdate): Observable<Role> {
    // If permissions are included, normalize them
    const normalizedData: RoleUpdate = { ...roleData };
    if (normalizedData.permissions) {
      normalizedData.permissions = this.normalizePermissionsForBackend(normalizedData.permissions);
    }
    
    return this.apiService.put<RoleResponse>(`${this.endpoint}/${id}`, normalizedData).pipe(
      map(response => this.formatRoleResponse(response))
    );
  }

  /**
   * Delete a role
   * @param id Role ID
   * @returns Observable of void
   */
  deleteRole(id: string): Observable<void> {
    return this.apiService.delete<void>(`${this.endpoint}/${id}`);
  }

  /**
   * Normalize permissions to the backend's expected format
   * @param permissions Array of permissions
   * @returns Normalized permissions array
   */
  private normalizePermissionsForBackend(permissions: string[]): string[] {
    return permissions.map(permission => {
      // If already in enum format, return as is
      if (permission.includes('PermissionArea.')) {
        return permission;
      }
      
      // If in simple format (area:action), convert to enum format
      if (permission.includes(':')) {
        const [area, action] = permission.split(':');
        return `PermissionArea.${area.toUpperCase()}:PermissionAction.${action.toUpperCase()}`;
      }
      
      // If neither format is detected, return as is
      return permission;
    });
  }

  /**
   * Format the role response to ensure consistent structure
   * @param role Role response from API
   * @returns Formatted Role object
   */
  private formatRoleResponse(role: RoleResponse): Role {
    return {
      ...role,
      _id: role._id.toString()
    };
  }
}