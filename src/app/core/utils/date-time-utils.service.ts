// src/app/shared/utils/date-time-utils.service.ts
import { Injectable } from '@angular/core';

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
    if (!minutes) return 0;
    return minutes / 60;
  }

  /**
   * Format minutes as "Xh Ym" string
   */
  public static formatDuration(minutes: number): string {
    if (!minutes) return '0h';
    
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours === 0) return `${mins}m`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
  }
}