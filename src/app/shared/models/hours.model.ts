// src/app/shared/models/hours.model.ts

export interface TimeEntry {
  _id?: string;
  employee_id: string;
  store_id: string;
  clock_in: string; // ISO datetime string
  clock_out?: string; // ISO datetime string
  break_start?: string; // ISO datetime string
  break_end?: string; // ISO datetime string
  total_minutes?: number;
  status: 'pending' | 'approved' | 'rejected';
  approved_by?: string;
  approved_at?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  
  // Extended properties for frontend use
  employee_name?: string;
  store_name?: string;
}

export interface WeeklyTimesheet {
  _id?: string;
  employee_id: string;
  store_id: string;
  week_start_date: string; // ISO date string YYYY-MM-DD
  week_end_date: string; // ISO date string YYYY-MM-DD
  time_entries: string[]; // Array of TimeEntry IDs
  total_hours: number;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  submitted_at?: string;
  approved_by?: string;
  approved_at?: string;
  rejection_reason?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  
  // Extended properties for frontend use
  employee_name?: string;
  store_name?: string;
}

export interface Schedule {
  _id?: string;
  title: string;
  store_id: string;
  start_date: string; // ISO date string YYYY-MM-DD
  end_date: string; // ISO date string YYYY-MM-DD
  shifts: ScheduleShift[];
  created_by: string;
  created_at?: string;
  updated_at?: string;
  
  // Extended properties for frontend use
  store_name?: string;
}

export interface ScheduleShift {
  _id?: string;
  employee_id: string;
  date: string; // ISO date string YYYY-MM-DD
  start_time: string; // Time in format HH:MM (24-hour)
  end_time: string; // Time in format HH:MM (24-hour)
  notes?: string;
  
  // Extended properties for frontend use
  employee_name?: string;
}