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
  
  // Reference to original schedule if created from a schedule
  schedule_id?: string | null;
  
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
  // New field to track schedule status
  status?: 'pending' | 'active' | 'completed';
  // Track when a schedule was completed
  completed_at?: string | null;
  completed_by?: string | null;
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

// System configuration for timesheet settings
export const TimesheetConfig = {
  // Number of days after week end that timesheets can be created (grace period)
  GRACE_PERIOD_DAYS: 14,
  // Maximum number of past weeks for which timesheets can be created
  MAX_PAST_WEEKS: 8,
  // Minimum hours required for a valid timesheet
  MIN_HOURS_REQUIRED: 0
};

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
      schedule_id: timesheet.schedule_id || null,
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

  /**
   * Check if the given date is within the grace period for timesheet creation
   * @param weekEndDate The end date of the week for the timesheet
   * @returns boolean True if the date is within the grace period
   */
  static isWithinGracePeriod(weekEndDate: string | Date): boolean {
    const endDate = new Date(weekEndDate);
    const today = new Date();
    
    // Calculate the grace period end date
    const gracePeriodEndDate = new Date(endDate);
    gracePeriodEndDate.setDate(gracePeriodEndDate.getDate() + TimesheetConfig.GRACE_PERIOD_DAYS);
    
    // Check if today is before or on the grace period end date
    return today <= gracePeriodEndDate;
  }

  /**
   * Check if a timesheet can be created for the specified week
   * @param weekStartDate The start date of the week
   * @returns { isValid: boolean, message: string } Validation result and message
   */
  static canCreateTimesheetForWeek(weekStartDate: string | Date): { isValid: boolean, message: string } {
    const startDate = new Date(weekStartDate);
    const today = new Date();
    
    // Calculate week end date (6 days after start)
    const weekEndDate = new Date(startDate);
    weekEndDate.setDate(startDate.getDate() + 6);
    
    // Check if the week is in the future
    if (startDate > today) {
      return { 
        isValid: false, 
        message: 'Cannot create timesheets for future weeks.' 
      };
    }
    
    // Check if the week is too far in the past (beyond max past weeks)
    const maxPastDate = new Date(today);
    maxPastDate.setDate(today.getDate() - (TimesheetConfig.MAX_PAST_WEEKS * 7));
    
    if (startDate < maxPastDate) {
      return { 
        isValid: false, 
        message: `Cannot create timesheets for weeks more than ${TimesheetConfig.MAX_PAST_WEEKS} weeks in the past.` 
      };
    }
    
    // Check if the week is within the grace period
    if (!this.isWithinGracePeriod(weekEndDate)) {
      return { 
        isValid: false, 
        message: `The grace period of ${TimesheetConfig.GRACE_PERIOD_DAYS} days for this timesheet has expired.` 
      };
    }
    
    return { isValid: true, message: 'Timesheet can be created for this week.' };
  }

  /**
   * Get remaining days in grace period
   * @param weekEndDate The end date of the week
   * @returns number of days remaining in grace period, or 0 if expired
   */
  static getRemainingGracePeriodDays(weekEndDate: string | Date): number {
    const endDate = new Date(weekEndDate);
    const today = new Date();
    
    // Calculate the grace period end date
    const gracePeriodEndDate = new Date(endDate);
    gracePeriodEndDate.setDate(gracePeriodEndDate.getDate() + TimesheetConfig.GRACE_PERIOD_DAYS);
    
    // If grace period has already ended, return 0
    if (today > gracePeriodEndDate) {
      return 0;
    }
    
    // Calculate days remaining
    const msPerDay = 1000 * 60 * 60 * 24;
    const daysRemaining = Math.ceil((gracePeriodEndDate.getTime() - today.getTime()) / msPerDay);
    
    return daysRemaining;
  }

  /**
   * Create daily hours object from schedule shifts
   * @param shifts Array of shifts from a schedule
   * @returns Daily hours object for timesheet
   */
  static createDailyHoursFromShifts(shifts: ScheduleShift[]): WeeklyTimesheet['daily_hours'] {
    const dailyHours: WeeklyTimesheet['daily_hours'] = {
      monday: 0,
      tuesday: 0,
      wednesday: 0,
      thursday: 0,
      friday: 0,
      saturday: 0,
      sunday: 0
    };
    
    // Process each shift
    shifts.forEach(shift => {
      const day = shift.day_of_week.toLowerCase();
      if (!dailyHours.hasOwnProperty(day)) return;
      
      // Parse start and end times
      const [startHours, startMinutes] = shift.start_time.split(':').map(Number);
      const [endHours, endMinutes] = shift.end_time.split(':').map(Number);
      
      // Calculate shift duration in hours
      let durationHours = endHours - startHours;
      let durationMinutes = endMinutes - startMinutes;
      
      // Handle overnight shifts
      if (durationHours < 0 || (durationHours === 0 && durationMinutes < 0)) {
        durationHours += 24;
      }
      
      // Convert duration to decimal hours
      const shiftHours = durationHours + (durationMinutes / 60);
      
      // Add to daily total
      dailyHours[day] += shiftHours;
    });
    
    // Round values to 2 decimal places
    Object.keys(dailyHours).forEach(day => {
      dailyHours[day] = Math.round(dailyHours[day] * 100) / 100;
    });
    
    return dailyHours;
  }
}