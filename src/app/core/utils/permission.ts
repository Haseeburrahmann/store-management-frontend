// src/app/core/utils/permission.ts

/**
 * Standard permission format: 'area:action'
 * e.g., 'users:read', 'hours:approve'
 */
export interface Permission {
    area: string;
    action: string;
  }
  
  /**
   * Permission action types
   */
  export enum PermissionAction {
    READ = 'read',
    WRITE = 'write',
    DELETE = 'delete',
    APPROVE = 'approve'
  }
  
  /**
   * Permission area types
   */
  export enum PermissionArea {
    USERS = 'users',
    ROLES = 'roles',
    STORES = 'stores',
    EMPLOYEES = 'employees',
    HOURS = 'hours',
    PAYMENTS = 'payments',
    INVENTORY = 'inventory',
    STOCK_REQUESTS = 'stock_requests',
    SALES = 'sales',
    REPORTS = 'reports'
  }
  
  /**
   * Formats a permission using area and action
   * 
   * @param area The permission area (e.g., 'users')
   * @param action The permission action (e.g., 'read')
   * @returns Formatted permission string (e.g., 'users:read')
   */
  export function formatPermission(area: string, action: string): string {
    return `${area.toLowerCase()}:${action.toLowerCase()}`;
  }
  
  /**
   * Parses a permission string into area and action
   * 
   * @param permission The permission string (e.g., 'users:read')
   * @returns Permission object with area and action
   */
  export function parsePermission(permission: string): Permission {
    // If the permission is in enum format (PermissionArea.X:PermissionAction.Y)
    if (permission.includes('PermissionArea.')) {
      const match = permission.match(/PermissionArea\.(\w+):PermissionAction\.(\w+)/i);
      if (match && match.length === 3) {
        const [_, area, action] = match;
        return {
          area: area.toLowerCase(),
          action: action.toLowerCase()
        };
      }
    }
    
    // If permission is in standard format (area:action)
    const parts = permission.split(':');
    if (parts.length === 2) {
      return {
        area: parts[0].toLowerCase(),
        action: parts[1].toLowerCase()
      };
    }
    
    // If permission can't be parsed, return empty
    console.warn(`Could not parse permission: ${permission}`);
    return { area: '', action: '' };
  }
  
  /**
   * Normalize a permission to standard format
   * 
   * @param permission Permission in any format
   * @returns Permission in standard format
   */
  export function normalizePermission(permission: string): string {
    const { area, action } = parsePermission(permission);
    return formatPermission(area, action);
  }
  
  /**
   * Convert permissions to standard format
   * 
   * @param permissions Array of permissions in any format
   * @returns Array of permissions in standard format with duplicates removed
   */
  export function normalizePermissions(permissions: string[]): string[] {
    // Create a set to avoid duplicates
    const normalizedSet = new Set<string>();
    
    permissions.forEach(permission => {
      const normalized = normalizePermission(permission);
      
      // Only add valid permissions
      if (normalized.includes(':')) {
        normalizedSet.add(normalized);
      }
    });
    
    return Array.from(normalizedSet);
  }
  
  /**
   * Format permissions for backend (PermissionArea.X:PermissionAction.Y format)
   * 
   * @param permissions Array of permissions in any format
   * @returns Array of permissions in backend format
   */
  export function formatPermissionsForBackend(permissions: string[]): string[] {
    return permissions.map(permission => {
      const { area, action } = parsePermission(permission);
      return `PermissionArea.${area.toUpperCase()}:PermissionAction.${action.toUpperCase()}`;
    });
  }
  
  /**
   * Check if a list of permissions includes a specific permission
   * 
   * @param userPermissions Array of user permissions
   * @param area Permission area to check
   * @param action Permission action to check
   * @returns True if the user has the permission
   */
  export function hasPermission(
    userPermissions: string[] | undefined,
    area: string,
    action: string
  ): boolean {
    if (!userPermissions || userPermissions.length === 0) {
      return false;
    }
    
    // Normalize all permissions
    const normalizedUserPermissions = normalizePermissions(userPermissions);
    const requiredPermission = formatPermission(area, action);
    
    // Simple check for the exact permission
    if (normalizedUserPermissions.includes(requiredPermission)) {
      return true;
    }
    
    // Handle singular/plural variations
    if (area.endsWith('s')) {
      // Try singular form
      const singularArea = area.slice(0, -1);
      const singularPermission = formatPermission(singularArea, action);
      if (normalizedUserPermissions.includes(singularPermission)) {
        return true;
      }
    } else {
      // Try plural form
      const pluralArea = `${area}s`;
      const pluralPermission = formatPermission(pluralArea, action);
      if (normalizedUserPermissions.includes(pluralPermission)) {
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * Get a list of permission areas a user has access to
   * 
   * @param userPermissions Array of user permissions
   * @returns Array of unique permission areas
   */
  export function getUserPermissionAreas(userPermissions: string[] | undefined): string[] {
    if (!userPermissions || userPermissions.length === 0) {
      return [];
    }
    
    const areas = new Set<string>();
    
    userPermissions.forEach(permission => {
      const { area } = parsePermission(permission);
      if (area) {
        areas.add(area);
      }
    });
    
    return Array.from(areas);
  }
  
  /**
   * Check if user has any permission for an area
   * 
   * @param userPermissions Array of user permissions
   * @param area Permission area to check
   * @returns True if the user has any permission for the area
   */
  export function hasAnyPermissionForArea(
    userPermissions: string[] | undefined,
    area: string
  ): boolean {
    if (!userPermissions || userPermissions.length === 0) {
      return false;
    }
    
    return userPermissions.some(permission => {
      const parsed = parsePermission(permission);
      return parsed.area === area.toLowerCase();
    });
  }
  
  /**
   * Create a hierarchical representation of all permissions
   * @returns Nested object with areas and actions
   */
  export function getPermissionHierarchy(): Record<string, string[]> {
    const hierarchy: Record<string, string[]> = {};
    
    // Add all areas with their available actions
    Object.values(PermissionArea).forEach(area => {
      if (typeof area === 'string') {
        hierarchy[area.toLowerCase()] = Object.values(PermissionAction)
          .filter(action => typeof action === 'string')
          .map(action => action.toLowerCase());
      }
    });
    
    return hierarchy;
  }