// src/app/shared/models/hours.model.ts
export interface WeeklyTimesheet {
  _id: string;
  employee_id: string;
  employee_name?: string | null;
  store_id: string;
  store_name?: string | null;
  week_start_date: string;
  week_end_date: string;
  
  // Time tracking
  daily_hours: {
    monday: number;
    tuesday: number;
    wednesday: number;
    thursday: number;
    friday: number;
    saturday: number;
    sunday: number;
    [key: string]: number; // For dynamic access
  };
  total_hours: number;
  
  // Payment info
  hourly_rate: number;
  total_earnings: number;
  payment_id?: string; // Added payment ID to link timesheets to payments
  
  // Status tracking
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  submitted_at?: string | null;
  approved_at?: string | null;
  approved_by?: string | null;
  rejection_reason?: string | null;
  
  // Notes
  notes?: string | null;
  
  // Metadata
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

export class TimesheetUtils {
  /**
   * Ensures a timesheet has all required fields, filling in defaults where necessary
   */
  static ensureComplete(timesheet: Partial<WeeklyTimesheet>): WeeklyTimesheet {
    if (!timesheet) {
      throw new Error('Cannot complete a null timesheet');
    }
    
    // Ensure daily_hours exists and has all days
    const daily_hours = timesheet.daily_hours || {
      monday: 0,
      tuesday: 0,
      wednesday: 0,
      thursday: 0,
      friday: 0,
      saturday: 0,
      sunday: 0
    };
    
    // Ensure all days exist in daily_hours
    ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].forEach(day => {
      if (daily_hours[day] === undefined || daily_hours[day] === null) {
        daily_hours[day] = 0;
      }
    });
    
    // Calculate total hours if not provided
    const total_hours = timesheet.total_hours ?? 
      Object.values(daily_hours).reduce((sum, hours) => sum + hours, 0);
    
    // Calculate total earnings if hourly rate is available but earnings are not
    const hourly_rate = timesheet.hourly_rate ?? 0;
    const total_earnings = timesheet.total_earnings ?? (hourly_rate * total_hours);
    
    return {
      _id: timesheet._id || '',
      employee_id: timesheet.employee_id || '',
      employee_name: timesheet.employee_name || null,
      store_id: timesheet.store_id || '',
      store_name: timesheet.store_name || null,
      week_start_date: timesheet.week_start_date || '',
      week_end_date: timesheet.week_end_date || '',
      daily_hours,
      total_hours,
      hourly_rate,
      total_earnings,
      payment_id: timesheet.payment_id, // Include payment_id in the completed timesheet
      status: timesheet.status || 'draft',
      submitted_at: timesheet.submitted_at || null,
      approved_at: timesheet.approved_at || null,
      approved_by: timesheet.approved_by || null,
      rejection_reason: timesheet.rejection_reason || null,
      notes: timesheet.notes || null,
      created_at: timesheet.created_at || new Date().toISOString(),
      updated_at: timesheet.updated_at || new Date().toISOString()
    };
  }
  
  /**
   * Safely get hours for a specific day, handling missing data
   */
  static getDayHours(timesheet: WeeklyTimesheet | null, day: string): number {
    if (!timesheet) return 0;
    if (!timesheet.daily_hours) return 0;
    return timesheet.daily_hours[day] || 0;
  }
  
  /**
   * Calculate total hours from daily hours
   */
  static calculateTotalHours(daily_hours: WeeklyTimesheet['daily_hours']): number {
    if (!daily_hours) return 0;
    return Object.values(daily_hours).reduce((sum, hours) => sum + hours, 0);
  }
}