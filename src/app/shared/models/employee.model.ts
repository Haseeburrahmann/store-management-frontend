export interface Employee {
  _id: string;
  user_id?: string;
  position: string;
  hire_date: string;
  store_id?: string;
  hourly_rate: number;
  employment_status: EmploymentStatus;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  created_at: string;
  updated_at: string;
  
  // These fields are added by the frontend or backend when getting employee with user/store info
  full_name?: string;
  email?: string;
  phone_number?: string;
  store_name?: string;
}

export interface EmployeeCreate {
  user_id?: string;
  position: string;
  hire_date?: string;
  store_id?: string;
  hourly_rate: number;
  employment_status?: EmploymentStatus;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
}

export interface EmployeeUpdate {
  position?: string;
  store_id?: string;
  hourly_rate?: number;
  employment_status?: EmploymentStatus;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  user_id?: string;
}

export interface EmployeeWithUserCreate {
  // User fields
  email: string;
  full_name: string;
  password: string;
  phone_number?: string;
  role_id?: string;

  // Employee fields
  position: string;
  hire_date?: string;
  store_id?: string;
  hourly_rate: number;
  employment_status?: EmploymentStatus;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
}

export enum EmploymentStatus {
  ACTIVE = 'active',
  ON_LEAVE = 'on_leave',
  TERMINATED = 'terminated'
}