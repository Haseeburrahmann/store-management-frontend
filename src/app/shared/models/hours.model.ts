export interface Hour {
  _id: string;
  employee_id: string;
  store_id: string;
  clock_in: string;
  clock_out?: string;
  break_start?: string;
  break_end?: string;
  total_minutes?: number;
  status: HourStatus;
  approved_by?: string;
  approved_at?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  
  // These fields are added by the frontend or backend when getting hour with employee/store info
  employee_name?: string;
  store_name?: string;
}

export interface HourCreate {
  employee_id: string;
  store_id: string;
  clock_in: string;
  clock_out?: string;
  break_start?: string;
  break_end?: string;
  notes?: string;
}

export interface HourUpdate {
  clock_out?: string;
  break_start?: string;
  break_end?: string;
  notes?: string;
}

export interface HourApproval {
  status: HourStatus;
  notes?: string;
}

export interface ClockInRequest {
  employee_id: string;
  store_id: string;
  notes?: string;
}

export interface ClockOutRequest {
  break_start?: string;
  break_end?: string;
  notes?: string;
}

export enum HourStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected'
}