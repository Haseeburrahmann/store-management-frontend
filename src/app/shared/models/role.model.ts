// src/app/shared/models/role.model.ts

export interface Role {
    _id: string; // Consistently use string for MongoDB IDs
    name: string;
    description?: string;
    permissions: string[]; // Will handle both formats
    created_at: string;
    updated_at: string;
  }
  
  export interface RoleCreate {
    name: string;
    description?: string;
    permissions: string[];
  }
  
  export interface RoleUpdate {
    name?: string;
    description?: string;
    permissions?: string[];
  }
  
  export interface RoleResponse {
    _id: string;
    name: string;
    description?: string;
    permissions: string[];
    created_at: string;
    updated_at: string;
  }
  
  // Helper type to standardize permission format
  export interface Permission {
    area: string;
    action: string;
  }
  
  // Permission format utilities
  export const formatPermission = (area: string, action: string): string => {
    return `${area.toLowerCase()}:${action.toLowerCase()}`;
  };
  
  export const parsePermission = (permission: string): Permission => {
    const [area, action] = permission.split(':');
    return {
      area: area.toLowerCase(),
      action: action.toLowerCase()
    };
  };