export interface Role {
  _id: string;
  name: string;
  description?: string;
  permissions: string[];
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

// Permission area constants matching backend
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

// Permission action constants matching backend
export enum PermissionAction {
  READ = 'read',
  WRITE = 'write',
  DELETE = 'delete',
  APPROVE = 'approve'
}

// Helper functions for permission handling
export function getPermissionString(area: PermissionArea, action: PermissionAction): string {
  return `${area}:${action}`;
}