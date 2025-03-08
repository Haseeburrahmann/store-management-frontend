export const API_CONFIG = {
  baseUrl: 'http://localhost:8000',
  apiPrefix: '/api/v1',
  timeout: 30000, // 30 seconds
  
  // Authentication endpoints
  auth: {
    login: '/auth/login',
    register: '/auth/register',
    me: '/auth/me'
  },
  
  // User management endpoints
  users: {
    base: '/users',
    getById: (id: string) => `/users/${id}`,
    me: '/users/me',
  },
  
  // Role management endpoints
  roles: {
    base: '/roles',
    getById: (id: string) => `/roles/${id}`,
  },
  
  // Store management endpoints
  stores: {
    base: '/stores',
    getById: (id: string) => `/stores/${id}`,
    managed: '/stores/managed',
    assignManager: (storeId: string, managerId: string) => `/stores/${storeId}/assign-manager/${managerId}`,
  },
  
  // Employee management endpoints
  employees: {
    base: '/employees',
    getById: (id: string) => `/employees/${id}`,
    byStore: (storeId: string) => `/employees/by-store/${storeId}`,
    me: '/employees/me',
    assignStore: (employeeId: string, storeId: string) => `/employees/${employeeId}/assign-store/${storeId}`,
    withUser: '/employees/with-user',
  },
  
  // Hours tracking endpoints
  hours: {
    base: '/hours',
    getById: (id: string) => `/hours/${id}`,
    me: '/hours/me',
    active: '/hours/active',
    clockIn: '/hours/clock-in',
    clockOut: (employeeId: string) => `/hours/clock-out/${employeeId}`,
    approve: (hourId: string) => `/hours/${hourId}/approve`,
  }
};