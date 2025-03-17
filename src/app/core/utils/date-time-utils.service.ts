// src/app/core/utils/date-time-utils.service.ts
import { Injectable } from '@angular/core';
import { TimesheetConfig } from '../../shared/models/hours.model';

@Injectable({
  providedIn: 'root'
})
export class DateTimeUtils {
  /**
   * Parse a date string into a Date object
   */
  public static parseDate(dateStr: string): Date | null {
    if (!dateStr) return null;
    
    try {
      const date = new Date(dateStr);
      // Check if date is valid
      if (isNaN(date.getTime())) return null;
      return date;
    } catch (error) {
      console.error('Error parsing date:', error);
      return null;
    }
  }

  /**
   * Format date as YYYY-MM-DD string
   */
  public static formatDateForAPI(date: Date | string): string {
    if (!date) return '';
    
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      return dateObj.toISOString().split('T')[0];
    } catch (error) {
      console.error('Error formatting date for API:', error);
      return '';
    }
  }

  /**
   * Format a date for display
   */
  public static formatDateForDisplay(dateStr: string, options: Intl.DateTimeFormatOptions = {}): string {
    if (!dateStr) return '';
    
    try {
      const date = new Date(dateStr);
      const defaultOptions: Intl.DateTimeFormatOptions = { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric'
      };
      
      return date.toLocaleDateString(undefined, { ...defaultOptions, ...options });
    } catch (error) {
      console.error('Error formatting date for display:', error);
      return dateStr; // Return original string if parsing fails
    }
  }

  /**
   * Format a time for display
   */
  public static formatTimeForDisplay(dateStr: string): string {
    if (!dateStr) return '';
    
    try {
      const date = new Date(dateStr);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (error) {
      console.error('Error formatting time for display:', error);
      return dateStr;
    }
  }

  /**
   * Convert HH:MM format to minutes
   */
  public static timeToMinutes(timeStr: string): number {
    if (!timeStr) return 0;
    
    try {
      const [hours, minutes] = timeStr.split(':').map(Number);
      return (hours * 60) + minutes;
    } catch (error) {
      console.error('Error converting time to minutes:', error);
      return 0;
    }
  }

  /**
   * Convert minutes to HH:MM format
   */
  public static minutesToTimeStr(minutes: number): string {
    if (minutes < 0) return '00:00';
    
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }

  /**
   * Validate if end time is after start time
   */
  public static isValidTimeRange(startTime: string, endTime: string): boolean {
    if (!startTime || !endTime) return false;
    
    const startMinutes = this.timeToMinutes(startTime);
    const endMinutes = this.timeToMinutes(endTime);
    
    return endMinutes > startMinutes;
  }

  /**
   * Calculate minutes between two dates or times
   */
  public static calculateDurationMinutes(startStr: string, endStr: string): number {
    if (!startStr || !endStr) return 0;
    
    try {
      const startDate = new Date(startStr);
      const endDate = new Date(endStr);
      return Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60));
    } catch (error) {
      console.error('Error calculating duration:', error);
      return 0;
    }
  }

  /**
   * Format minutes as hours (decimal)
   */
  public static minutesToHours(minutes: number): number {
    if (!minutes && minutes !== 0) return 0;
    return minutes / 60;
  }

  /**
   * Format minutes as "Xh Ym" string
   */
  public static formatDuration(minutes: number): string {
    if (!minutes && minutes !== 0) return '0h';
    
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours === 0) return `${mins}m`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
  }
  
  /**
   * Get day of week (name) from date
   */
  public static getDayOfWeek(date: Date | string): string {
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      return days[dateObj.getDay()];
    } catch (error) {
      console.error('Error getting day of week:', error);
      return '';
    }
  }
  
  /**
   * Get dates for each day of the week containing the given date
   */
  public static getWeekDays(date: Date): Date[] {
    const result: Date[] = [];
    const day = date.getDay() || 7; // Convert Sunday (0) to 7
    const monday = new Date(date);
    monday.setDate(date.getDate() - day + 1); // +1 to start with Monday
    
    for (let i = 0; i < 7; i++) {
      const currentDay = new Date(monday);
      currentDay.setDate(monday.getDate() + i);
      result.push(currentDay);
    }
    
    return result;
  }

  /**
   * Get the start date (Monday) for a given week number in a year
   * @param year The year
   * @param weekNumber The ISO week number (1-53)
   * @returns Date object representing the Monday of that week
   */
  public static getStartDateOfWeek(year: number, weekNumber: number): Date {
    // Create a date for Jan 1 of the given year
    const januaryFirst = new Date(year, 0, 1);
    
    // Get the day of week for Jan 1 (0 = Sunday, 1 = Monday, etc.)
    const dayOfWeek = januaryFirst.getDay();
    
    // Calculate days to first Monday of the year
    const daysToFirstMonday = (dayOfWeek <= 1) ? (1 - dayOfWeek) : (8 - dayOfWeek);
    
    // Get first Monday of the year
    const firstMonday = new Date(year, 0, 1 + daysToFirstMonday);
    
    // Calculate the Monday of the desired week
    const result = new Date(firstMonday);
    result.setDate(firstMonday.getDate() + (weekNumber - 1) * 7);
    
    return result;
  }

  /**
   * Get the ISO week number for a given date
   * @param date The date to find the week number for
   * @returns The ISO week number (1-53)
   */
  public static getWeekNumber(date: Date): number {
    // Copy date to avoid modifying the original
    const d = new Date(date);
    
    // Set to nearest Thursday (ISO weeks start on Monday, so Thursday is middle of week)
    d.setDate(d.getDate() + 4 - (d.getDay() || 7));
    
    // Get first day of year
    const yearStart = new Date(d.getFullYear(), 0, 1);
    
    // Calculate week number: Week 1 + number of weeks
    const weekNumber = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    
    return weekNumber;
  }

  /**
   * Get an array of past weeks up to the maximum allowed
   * @returns Array of week objects containing start and end dates
   */
  public static getPastWeeks(currentWeek: boolean = true): Array<{
    startDate: Date;
    endDate: Date;
    weekNumber: number;
    year: number;
    label: string;
  }> {
    const today = new Date();
    const result = [];
    
    // Get the start of the current week (Monday)
    const currentWeekStart = this.getStartOfWeek(today);
    
    // If we're including the current week, add it first
    if (currentWeek) {
      const currentWeekEnd = new Date(currentWeekStart);
      currentWeekEnd.setDate(currentWeekStart.getDate() + 6);
      
      result.push({
        startDate: currentWeekStart,
        endDate: currentWeekEnd,
        weekNumber: this.getWeekNumber(currentWeekStart),
        year: currentWeekStart.getFullYear(),
        label: `Current Week (${this.formatDateForDisplay(currentWeekStart.toISOString())} - ${this.formatDateForDisplay(currentWeekEnd.toISOString())})`
      });
    }
    
    // Add past weeks up to the maximum
    for (let i = 1; i <= TimesheetConfig.MAX_PAST_WEEKS; i++) {
      const weekStart = new Date(currentWeekStart);
      weekStart.setDate(currentWeekStart.getDate() - (i * 7));
      
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      
      // Check if this week is still within the grace period
      const isWithinGracePeriod = this.isWithinGracePeriod(weekStart, weekEnd);
      
      // Only add weeks that are within the grace period
      if (isWithinGracePeriod) {
        result.push({
          startDate: weekStart,
          endDate: weekEnd,
          weekNumber: this.getWeekNumber(weekStart),
          year: weekStart.getFullYear(),
          label: `Week ${this.getWeekNumber(weekStart)} (${this.formatDateForDisplay(weekStart.toISOString())} - ${this.formatDateForDisplay(weekEnd.toISOString())})`
        });
      }
    }
    
    return result;
  }

  /**
   * Check if a week is within the grace period for timesheet creation
   * @param weekStart The start date of the week
   * @param weekEnd The end date of the week
   * @returns True if the week is within the grace period
   */
  public static isWithinGracePeriod(weekStart: Date, weekEnd: Date): boolean {
    const today = new Date();
    
    // Calculate the grace period end date
    const gracePeriodEndDate = new Date(weekEnd);
    gracePeriodEndDate.setDate(gracePeriodEndDate.getDate() + TimesheetConfig.GRACE_PERIOD_DAYS);
    
    // Check if today is before or on the grace period end date
    return today <= gracePeriodEndDate;
  }

  /**
   * Get start of the week (Monday) for a given date
   */
  public static getStartOfWeek(date: Date): Date {
    const result = new Date(date);
    const day = result.getDay() || 7; // Convert Sunday (0) to 7 for easier calculation
    const diff = result.getDate() - day + 1; // +1 to start with Monday
    result.setDate(diff);
    result.setHours(0, 0, 0, 0);
    return result;
  }

  /**
   * Get end of the week (Sunday) for a given date
   */
  public static getEndOfWeek(date: Date): Date {
    const result = new Date(date);
    const day = result.getDay() || 7; // Convert Sunday (0) to 7
    const diff = result.getDate() - day + 7; // +7 to end with Sunday
    result.setDate(diff);
    result.setHours(23, 59, 59, 999);
    return result;
  }
}