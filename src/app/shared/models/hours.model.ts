// src/app/shared/models/hours.model.ts
export interface Hour {
    _id: string;
    employee_id: string;
    store_id: string;
    clock_in: string;
    clock_out?: string;
    break_start?: string;
    break_end?: string;
    total_minutes?: number;
    status: 'pending' | 'approved' | 'rejected';
    approved_by?: string;
    approved_at?: string;
    notes?: string;
    created_at: string;
    updated_at: string;
    
    // Extended properties for frontend use
    employee_name?: string;
    store_name?: string;
  }