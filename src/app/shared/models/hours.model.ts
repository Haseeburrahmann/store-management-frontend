// src/app/shared/models/hours.model.ts
export interface WeeklyTimesheet {
  _id?: string;
  employee_id: string;
  employee_name?: string;  // For UI display
  store_id: string;
  store_name?: string;     // For UI display
  week_start_date: string;
  week_end_date: string;
  daily_hours: {
    monday: number;
    tuesday: number;
    wednesday: number;
    thursday: number;
    friday: number;
    saturday: number;
    sunday: number;
  };
  total_hours: number;
  hourly_rate: number;
  total_earnings: number;
  status: string;  // 'draft', 'submitted', 'approved', 'rejected'
  notes?: string;
  submitted_at?: string;
  submitted_by?: string;
  approved_by?: string;
  approved_at?: string;
  rejection_reason?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Schedule {
  _id?: string;
  store_id: string;
  store_name?: string;  // For UI display
  title: string;
  week_start_date: string;
  week_end_date: string;
  shifts: ScheduleShift[];
  created_by: string;
  created_at?: string;
  updated_at?: string;
  shift_count: number; // Add this field
}

export interface ScheduleShift {
  _id?: string;
  employee_id: string;
  employee_name?: string;  // For UI display
  day_of_week: string;  // 'monday', 'tuesday', etc.
  start_time: string;   // In 'HH:MM' format
  end_time: string;     // In 'HH:MM' format
  notes?: string;
}

