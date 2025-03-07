// src/app/core/utils/data-formatting.ts

/**
 * Formats a date according to the specified format
 * @param date Date to format (string or Date object)
 * @param format Format string ('short', 'medium', 'long', 'full', or custom)
 * @returns Formatted date string
 */
export function formatDate(date: string | Date, format: 'short' | 'medium' | 'long' | 'full' | string = 'medium'): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    if (isNaN(dateObj.getTime())) {
      return 'Invalid date';
    }
    
    // Predefined formats
    switch (format) {
      case 'short':
        return dateObj.toLocaleDateString();
      case 'medium':
        return dateObj.toLocaleDateString(undefined, { 
          year: 'numeric', 
          month: 'short', 
          day: 'numeric' 
        });
      case 'long':
        return dateObj.toLocaleDateString(undefined, { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric',
          weekday: 'short'
        });
      case 'full':
        return dateObj.toLocaleDateString(undefined, { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric',
          weekday: 'long'
        });
    }
    
    // Custom format - basic implementation
    let result = format;
    
    // Year
    result = result.replace('yyyy', dateObj.getFullYear().toString());
    result = result.replace('yy', dateObj.getFullYear().toString().substring(2));
    
    // Month
    const month = dateObj.getMonth() + 1;
    result = result.replace('MM', month.toString().padStart(2, '0'));
    result = result.replace('M', month.toString());
    
    // Day
    const day = dateObj.getDate();
    result = result.replace('dd', day.toString().padStart(2, '0'));
    result = result.replace('d', day.toString());
    
    // Hours
    const hours24 = dateObj.getHours();
    const hours12 = hours24 % 12 || 12;
    result = result.replace('HH', hours24.toString().padStart(2, '0'));
    result = result.replace('H', hours24.toString());
    result = result.replace('hh', hours12.toString().padStart(2, '0'));
    result = result.replace('h', hours12.toString());
    
    // Minutes
    const minutes = dateObj.getMinutes();
    result = result.replace('mm', minutes.toString().padStart(2, '0'));
    result = result.replace('m', minutes.toString());
    
    // Seconds
    const seconds = dateObj.getSeconds();
    result = result.replace('ss', seconds.toString().padStart(2, '0'));
    result = result.replace('s', seconds.toString());
    
    // AM/PM
    const ampm = hours24 < 12 ? 'AM' : 'PM';
    result = result.replace('a', ampm.toLowerCase());
    result = result.replace('A', ampm);
    
    return result;
  }
  
  /**
   * Formats a number as currency
   * @param value Number to format
   * @param currency Currency code
   * @param locale Locale for formatting
   * @returns Formatted currency string
   */
  export function formatCurrency(
    value: number, 
    currency = 'USD', 
    locale = 'en-US'
  ): string {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  }
  
  /**
   * Formats a number as a percentage
   * @param value Number to format (0-1 or 0-100)
   * @param convertFromDecimal Whether to convert from decimal (0-1) to percentage
   * @param decimals Number of decimal places
   * @returns Formatted percentage string
   */
  export function formatPercentage(
    value: number, 
    convertFromDecimal = false, 
    decimals = 2
  ): string {
    const percentValue = convertFromDecimal ? value * 100 : value;
    return `${percentValue.toFixed(decimals)}%`;
  }
  
  /**
   * Formats a number with thousands separators
   * @param value Number to format
   * @param decimals Number of decimal places
   * @param locale Locale for formatting
   * @returns Formatted number string
   */
  export function formatNumber(
    value: number, 
    decimals = 0, 
    locale = 'en-US'
  ): string {
    return new Intl.NumberFormat(locale, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(value);
  }
  
  /**
   * Formats a large number in a compact way (K, M, B)
   * @param value Number to format
   * @param decimals Number of decimal places
   * @returns Formatted compact number string
   */
  export function formatCompactNumber(value: number, decimals = 1): string {
    if (value === null || value === undefined || isNaN(value)) {
      return '0';
    }
  
    const absValue = Math.abs(value);
    
    if (absValue >= 1000000000) {
      return `${(value / 1000000000).toFixed(decimals)}B`;
    }
    
    if (absValue >= 1000000) {
      return `${(value / 1000000).toFixed(decimals)}M`;
    }
    
    if (absValue >= 1000) {
      return `${(value / 1000).toFixed(decimals)}K`;
    }
    
    return value.toFixed(decimals);
  }
  
  /**
   * Truncates text to a specified length
   * @param text Text to truncate
   * @param maxLength Maximum length before truncation
   * @param suffix Suffix to add after truncation
   * @returns Truncated text
   */
  export function truncateText(
    text: string,
    maxLength: number,
    suffix = '...'
  ): string {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    
    return `${text.substring(0, maxLength)}${suffix}`;
  }
  
  /**
   * Formats a file size in bytes to a human-readable format
   * @param bytes Size in bytes
   * @param decimals Number of decimal places
   * @returns Formatted file size string
   */
  export function formatFileSize(bytes: number, decimals = 2): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`;
  }
  
  /**
   * Converts a snake_case or kebab-case string to camelCase
   * @param text Text to convert
   * @returns camelCase text
   */
  export function toCamelCase(text: string): string {
    return text
      .replace(/[-_](.)/g, (_, char) => char.toUpperCase())
      .replace(/^(.)/, (_, char) => char.toLowerCase());
  }
  
  /**
   * Converts a camelCase string to Title Case with spaces
   * @param text Text to convert
   * @returns Title Case text
   */
  export function toTitleCase(text: string): string {
    // First add spaces between camelCase
    const spaced = text.replace(/([A-Z])/g, ' $1').trim();
    
    // Then capitalize first letter
    return spaced.charAt(0).toUpperCase() + spaced.slice(1);
  }
  
  /**
   * Masks sensitive information (e.g., for credit cards, phones, etc.)
   * @param text Text to mask
   * @param visibleChars Number of characters to leave visible at the end
   * @param maskChar Character to use for masking
   * @returns Masked text
   */
  export function maskSensitiveInfo(
    text: string,
    visibleChars = 4,
    maskChar = '*'
  ): string {
    if (!text) return '';
    
    const length = text.length;
    if (length <= visibleChars) return text;
    
    const maskedPortion = maskChar.repeat(length - visibleChars);
    const visiblePortion = text.substring(length - visibleChars);
    
    return `${maskedPortion}${visiblePortion}`;
  }
  
  /**
   * Formats a phone number to a standard format
   * @param phone Phone number to format
   * @param format Format to use (e.g., 'XXX-XXX-XXXX')
   * @returns Formatted phone number
   */
  export function formatPhoneNumber(
    phone: string,
    format = 'XXX-XXX-XXXX'
  ): string {
    if (!phone) return '';
    
    // Remove all non-digits
    const digits = phone.replace(/\D/g, '');
    
    let result = format;
    let digitIndex = 0;
    
    for (let i = 0; i < format.length; i++) {
      if (format[i] === 'X') {
        if (digitIndex < digits.length) {
          result = result.substring(0, i) + digits[digitIndex++] + result.substring(i + 1);
        } else {
          // Not enough digits for the format
          result = result.substring(0, i) + 'X' + result.substring(i + 1);
        }
      }
    }
    
    return result;
  }
  
  /**
   * Get time period label based on date
   * @param date Date to get period for
   * @param periodType Type of period (day, week, month, quarter, year)
   * @returns Period label
   */
  export function getPeriodLabel(
    date: Date | string,
    periodType: 'day' | 'week' | 'month' | 'quarter' | 'year'
  ): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    switch (periodType) {
      case 'day':
        return formatDate(dateObj, 'MM/dd/yyyy');
      case 'week':
        // Get week number (1-52)
        const oneJan = new Date(dateObj.getFullYear(), 0, 1);
        const weekNum = Math.ceil((((dateObj.getTime() - oneJan.getTime()) / 86400000) + oneJan.getDay() + 1) / 7);
        return `Week ${weekNum}, ${dateObj.getFullYear()}`;
      case 'month':
        return dateObj.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
      case 'quarter':
        const quarter = Math.floor(dateObj.getMonth() / 3) + 1;
        return `Q${quarter} ${dateObj.getFullYear()}`;
      case 'year':
        return dateObj.getFullYear().toString();
      default:
        return '';
    }
  }
  
  /**
   * Get color based on value and thresholds
   * @param value Value to check
   * @param thresholds Threshold values for color changes
   * @param colors Colors corresponding to thresholds
   * @returns Color code
   */
  export function getColorBasedOnValue(
    value: number,
    thresholds: number[],
    colors: string[]
  ): string {
    // Ensure thresholds and colors are sorted from lowest to highest threshold
    const pairs = thresholds.map((threshold, index) => ({ threshold, color: colors[index] }));
    pairs.sort((a, b) => a.threshold - b.threshold);
    
    // Default to the last color if value exceeds all thresholds
    let result = colors[colors.length - 1];
    
    for (let i = 0; i < pairs.length; i++) {
      if (value <= pairs[i].threshold) {
        result = pairs[i].color;
        break;
      }
    }
    
    return result;
  }