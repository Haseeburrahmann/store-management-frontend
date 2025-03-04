// src/app/core/models/employee.model.ts
export interface Employee {
    role_id: string;
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
    store_name?: string;
    hire_date: Date;
    user_id: string;
    created_at: Date;
    updated_at: Date;
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
    hire_date?: Date;
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
    store_id?: string;
    hire_date?: Date;
    role_id?: string;
  }