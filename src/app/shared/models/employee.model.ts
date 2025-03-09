// src/app/shared/models/employee.model.ts
export interface Employee {
    _id: string;
    user_id?: string;
    position: string;
    hire_date: string;
    store_id?: string;
    hourly_rate: number;
    employment_status: 'active' | 'on_leave' | 'terminated';
    emergency_contact_name?: string;
    emergency_contact_phone?: string;
    address?: string;
    city?: string;
    state?: string;
    zip_code?: string;
    created_at: string;
    updated_at: string;
    
    // Extended properties for frontend use
    full_name?: string;
    email?: string;
    phone_number?: string;
    store_name?: string;
  }