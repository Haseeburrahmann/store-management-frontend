// src/app/shared/models/employee.model.ts

export interface Employee {
    _id: string; // Consistently use string for MongoDB IDs
    email: string;
    full_name: string;
    phone_number?: string;
    is_active: boolean;
    position: string;
    hourly_rate: number;
    employment_status: string;
    emergency_contact_name?: string;
    emergency_contact_phone?: string;
    address?: string;
    city?: string;
    state?: string;
    zip_code?: string;
    store_id?: string;
    store?: {
      _id: string;
      name: string;
    }; // Replace store_name with proper object
    hire_date: string | Date; // Support both string and Date
    user_id: string;
    role_id: string;
    created_at: string | Date;
    updated_at: string | Date;
  }
  
  export interface EmployeeCreate {
    email: string;
    full_name: string;
    phone_number?: string;
    password: string;
    is_active?: boolean;
    position: string;
    hourly_rate: number;
    employment_status?: string;
    emergency_contact_name?: string;
    emergency_contact_phone?: string;
    address?: string;
    city?: string;
    state?: string;
    zip_code?: string;
    store_id?: string;
    hire_date?: string | Date;
    role_id?: string;
  }
  
  export interface EmployeeUpdate {
    email?: string;
    full_name?: string;
    phone_number?: string;
    password?: string;
    is_active?: boolean;
    position?: string;
    hourly_rate?: number;
    employment_status?: string;
    emergency_contact_name?: string;
    emergency_contact_phone?: string;
    address?: string;
    city?: string;
    state?: string;
    zip_code?: string;
    store_id?: string | null; // Allow null to remove store assignment
    hire_date?: string | Date;
    role_id?: string;
  }
  
  export interface EmployeeResponse {
    _id: string;
    email: string;
    full_name: string;
    phone_number?: string;
    is_active: boolean;
    position: string;
    hourly_rate: number;
    employment_status: string;
    emergency_contact_name?: string;
    emergency_contact_phone?: string;
    address?: string;
    city?: string;
    state?: string;
    zip_code?: string;
    store_id?: string;
    store?: {
      _id: string;
      name: string;
    };
    hire_date: string;
    user_id: string;
    role_id: string;
    role?: {
      _id: string;
      name: string;
    };
    created_at: string;
    updated_at: string;
  }