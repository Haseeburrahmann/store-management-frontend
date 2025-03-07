// src/app/shared/models/hours.model.ts

import { Employee } from './employee.model';
import { Store } from './store.model';

export enum HoursStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  DRAFT = 'draft'
}

/**
 * Hours entity as returned from the API
 */
export interface HoursResponse {
  _id: string | any; // MongoDB ID can come as string or object
  employee_id: string | any;
  store_id: string | any;
  date: string | Date;
  clock_in: string | Date;
  clock_out?: string | Date;
  break_start?: string | Date;
  break_end?: string | Date;
  total_hours?: number;
  status: HoursStatus ;
  notes?: string;
  approved_by?: string | any;
  approved_at?: string | Date;
  rejection_reason?: string;
  created_at: string | Date;
  updated_at: string | Date;
  employee?: Employee | Partial<Employee>;
  store?: Store | Partial<Store>;
}

/**
 * Hours entity standardized for frontend use
 */
export interface Hours {
  _id: string;
  employee_id: string;
  store_id: string;
  date: string;
  clock_in: string;
  clock_out?: string;
  break_start?: string;
  break_end?: string;
  total_hours?: number;
  status: HoursStatus;
  notes?: string;
  approved_by?: string;
  approved_at?: string;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
  employee?: Employee;
  store?: Store;
}

/**
 * Data required to create a new Hours record
 */
export interface HoursCreate {
  employee_id: string;
  store_id: string;
  date?: string | Date;
  clock_in: string | Date;
  clock_out?: string | Date;
  break_start?: string | Date;
  break_end?: string | Date;
  notes?: string;
}

/**
 * Data allowed for updating an Hours record
 */
export interface HoursUpdate {
  clock_out?: string | Date;
  break_start?: string | Date;
  break_end?: string | Date;
  notes?: string;
}

/**
 * Data for approving or rejecting hours
 */
export interface HoursApproval {
  status: HoursStatus;
  rejection_reason?: string;
}

/**
 * Data for clocking in an employee
 */
export interface ClockInRequest {
  employee_id: string;
  store_id: string;
  notes?: string;
}

/**
 * Data for clocking out an employee
 */
export interface ClockOutRequest {
  break_start?: string | Date;
  break_end?: string | Date;
  notes?: string;
}

/**
 * Weekly timesheet summary for an employee
 */
export interface TimeSheetSummary {
  employee_id: string;
  employee_name?: string; // Added this field that was missing
  week_start_date: string;
  week_end_date: string;
  total_hours: number;
  regular_hours: number;
  overtime_hours: number;
  pending_hours: number;
  approved_hours: number;
  rejected_hours: number;
  daily_hours: {
    [date: string]: number;
  };
}

/**
 * Helper function to format a date for API requests
 * @param date Date to format
 * @returns Formatted date string
 */
export function formatDateForApi(date: Date): string {
  return date.toISOString();
}

/**
 * Helper function to format a date for display
 * @param date Date string to format
 * @param includeTime Whether to include time
 * @returns Formatted date string for display
 */
export function formatDateForDisplay(date: string | undefined, includeTime: boolean = false): string {
  if (!date) return 'N/A';
  
  try {
    const dateObj = new Date(date);
    
    if (includeTime) {
      return dateObj.toLocaleString();
    } else {
      return dateObj.toLocaleDateString();
    }
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid Date';
  }
}

/**
 * Calculate hours between two date strings
 * @param start Start date/time string
 * @param end End date/time string
 * @returns Number of hours (decimal)
 */
export function calculateHours(start: string, end: string): number {
  try {
    const startDate = new Date(start);
    const endDate = new Date(end);
    
    // Calculate difference in milliseconds
    const diffMs = endDate.getTime() - startDate.getTime();
    
    // Convert to hours with 2 decimal places
    return parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2));
  } catch (error) {
    console.error('Error calculating hours:', error);
    return 0;
  }
}