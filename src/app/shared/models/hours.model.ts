// src/app/shared/models/hours.model.ts

export enum HoursStatus {
    PENDING = 'pending',
    APPROVED = 'approved',
    REJECTED = 'rejected'
  }
  
  export interface Hours {
    _id: string; // Consistently use string for MongoDB IDs
    employee_id: string;
    employee?: {
      _id: string;
      full_name: string;
    }; // Replace employee_name with proper object
    store_id: string;
    store?: {
      _id: string;
      name: string;
    }; // Replace store_name with proper object
    clock_in: string; // Use string for dates consistently
    clock_out?: string;
    break_start?: string;
    break_end?: string;
    total_minutes?: number;
    status: HoursStatus;
    approved_by?: string;
    approved_by_user?: {
      _id: string;
      full_name: string;
    };
    approved_at?: string;
    notes?: string;
    created_at: string;
    updated_at: string;
  }
  
  export interface HoursCreate {
    employee_id: string;
    store_id: string;
    clock_in: string | Date;
    clock_out?: string | Date;
    break_start?: string | Date;
    break_end?: string | Date;
    notes?: string;
  }
  
  export interface HoursUpdate {
    clock_out?: string | Date;
    break_start?: string | Date;
    break_end?: string | Date;
    notes?: string;
  }
  
  export interface HoursApproval {
    status: HoursStatus;
    notes?: string;
  }
  
  export interface ClockInRequest {
    employee_id: string;
    store_id: string;
    notes?: string;
  }
  
  export interface ClockOutRequest {
    break_start?: string | Date;
    break_end?: string | Date;
    notes?: string;
  }
  
  export interface TimeSheetSummary {
    employee_id: string;
    employee?: {
      _id: string;
      full_name: string;
    };
    total_hours: number;
    approved_hours: number;
    pending_hours: number;
    week_start_date: string;
    week_end_date: string;
    daily_hours: { [date: string]: number };
  }
  
  export interface HoursResponse {
    _id: string;
    employee_id: string;
    employee?: {
      _id: string;
      full_name: string;
    };
    store_id: string;
    store?: {
      _id: string;
      name: string;
    };
    clock_in: string;
    clock_out?: string;
    break_start?: string;
    break_end?: string;
    total_minutes?: number;
    status: HoursStatus;
    approved_by?: string;
    approved_by_user?: {
      _id: string;
      full_name: string;
    };
    approved_at?: string;
    notes?: string;
    created_at: string;
    updated_at: string;
  }
  
  // Helper function to format dates consistently for API
  export const formatDateForApi = (date: Date | string): string => {
    if (typeof date === 'string') {
      return date;
    }
    return date.toISOString();
  };
  
  // Helper function to convert API dates to Date objects
  export const parseApiDate = (dateString: string | null | undefined): Date | undefined => {
    if (!dateString) return undefined;
    return new Date(dateString);
  };