/**
 * Permission utilities for role-based access control
 */

/**
 * Check if a user has the required permission
 */
export function hasPermission(userPermissions: string[], requiredPermission: string): boolean {
  if (!userPermissions || userPermissions.length === 0) {
    return false;
  }
  
  return userPermissions.includes(requiredPermission);
}

/**
 * Check if a user has any of the required permissions
 */
export function hasAnyPermission(userPermissions: string[], requiredPermissions: string[]): boolean {
  if (!userPermissions || userPermissions.length === 0) {
    return false;
  }
  
  return requiredPermissions.some(permission => userPermissions.includes(permission));
}

/**
 * Check if a user has all of the required permissions
 */
export function hasAllPermissions(userPermissions: string[], requiredPermissions: string[]): boolean {
  if (!userPermissions || userPermissions.length === 0) {
    return false;
  }
  
  return requiredPermissions.every(permission => userPermissions.includes(permission));
}

/**
 * Format permission string for display
 */
export function formatPermission(permission: string): string {
  if (!permission) {
    return '';
  }
  
  const [area, action] = permission.split(':');
  return `${capitalizeFirstLetter(area)} - ${formatAction(action)}`;
}

/**
 * Format action for display
 */
function formatAction(action: string): string {
  switch (action) {
    case 'read':
      return 'View';
    case 'write':
      return 'Create/Edit';
    case 'delete':
      return 'Delete';
    case 'approve':
      return 'Approve';
    default:
      return capitalizeFirstLetter(action);
  }
}

/**
 * Capitalize first letter of a string
 */
function capitalizeFirstLetter(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}