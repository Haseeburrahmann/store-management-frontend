// src/app/core/config/timesheet-config.ts
import { InjectionToken } from '@angular/core';

/**
 * Timesheet configuration settings
 */
export interface TimesheetConfigSettings {
  // Number of days after week end that timesheets can be created (grace period)
  GRACE_PERIOD_DAYS: number;
  
  // Maximum number of past weeks for which timesheets can be created
  MAX_PAST_WEEKS: number;
  
  // Minimum hours required for a valid timesheet
  MIN_HOURS_REQUIRED: number;
  
  // Whether to auto-approve timesheets created from completed schedules
  AUTO_APPROVE_FROM_SCHEDULE: boolean;
}

/**
 * Default timesheet configuration settings
 */
export const DEFAULT_TIMESHEET_CONFIG: TimesheetConfigSettings = {
  GRACE_PERIOD_DAYS: 14,
  MAX_PAST_WEEKS: 8,
  MIN_HOURS_REQUIRED: 0,
  AUTO_APPROVE_FROM_SCHEDULE: false
};

/**
 * Injection token for timesheet configuration
 */
export const TIMESHEET_CONFIG = new InjectionToken<TimesheetConfigSettings>(
  'Timesheet Configuration',
  {
    providedIn: 'root',
    factory: () => DEFAULT_TIMESHEET_CONFIG
  }
);