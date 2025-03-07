// src/app/shared/models/employee.model.ts

import { Store } from './store.model';

export enum EmploymentStatus {
  ACTIVE = 'active',
  ON_LEAVE = 'on_leave',
  TERMINATED = 'terminated'
}

/**
 * Employee entity as returned from the API
 */
export interface EmployeeResponse {
  _id: string | any; // MongoDB ID can come as string or object
  user_id: string | any;
  role_id?: string | any;
  email: string;
  full_name: string;
  phone_number?: string;
  position: string;
  employment_status: EmploymentStatus | string;
  hourly_rate: number;
  is_active: boolean;
  hire_date: string | Date;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  store_id?: string | any;
  created_at: string | Date;
  updated_at: string | Date;
  // Nested objects
  store?: {
    _id: string | any;
    name: string;
    [key: string]: any;
  };
  user?: {
    _id: string | any;
    email: string;
    full_name: string;
    [key: string]: any;
  };
}

/**
 * Employee entity standardized for frontend use
 */
export interface Employee {
  _id: string;
  user_id: string;
  role_id?: string;
  email: string;
  full_name: string;
  phone_number?: string;
  position: string;
  employment_status: EmploymentStatus | string;
  hourly_rate: number;
  is_active: boolean;
  hire_date: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  store_id?: string;
  created_at: string;
  updated_at: string;
  // Nested objects with consistent IDs
  store?: Store;
}

/**
 * Data required to create a new Employee
 */
export interface EmployeeCreate {
  user_id: string;
  email: string;
  full_name: string;
  phone_number?: string;
  position: string;
  employment_status: EmploymentStatus | string;
  hourly_rate: number;
  is_active: boolean;
  hire_date: string | Date;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  store_id?: string;
  role_id?: string;
  password?: string; // For creating associated user
}

/**
 * Data allowed for updating an Employee
 */
export interface EmployeeUpdate {
  email?: string;
  full_name?: string;
  phone_number?: string;
  position?: string;
  employment_status?: EmploymentStatus | string;
  hourly_rate?: number;
  is_active?: boolean;
  hire_date?: string | Date;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  store_id?: string;
  role_id?: string;
}

/**
 * List response with pagination
 */
export interface EmployeeListResponse {
  items: EmployeeResponse[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

/**
 * Format date for display
 * @param date Date string to format
 * @returns Formatted date string
 */
export function formatEmployeeDate(date: string | Date | undefined): string {
  if (!date) return 'N/A';
  
  try {
    return new Date(date).toLocaleDateString();
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid Date';
  }
}