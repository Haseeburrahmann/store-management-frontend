// src/app/core/utils/chart-utils.ts
import { CategoryDataPoint, TimeSeriesDataPoint } from '../models/analytics.model';

/**
 * Formats a number to K/M/B format (e.g. 1000 -> 1K)
 * @param value Number to format
 * @param decimals Number of decimal places
 * @returns Formatted string
 */
export function formatCompactNumber(value: number, decimals = 1): string {
  const absValue = Math.abs(value);
  
  if (absValue >= 1000000000) {
    return (value / 1000000000).toFixed(decimals) + 'B';
  }
  
  if (absValue >= 1000000) {
    return (value / 1000000).toFixed(decimals) + 'M';
  }
  
  if (absValue >= 1000) {
    return (value / 1000).toFixed(decimals) + 'K';
  }
  
  return value.toFixed(decimals);
}

/**
 * Formats a currency value
 * @param value Number to format
 * @param compact Whether to use compact notation
 * @param currency Currency code
 * @returns Formatted string
 */
export function formatCurrency(value: number, compact = false, currency = 'USD'): string {
  if (compact) {
    return '$' + formatCompactNumber(value);
  }
  
  return value.toLocaleString('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

/**
 * Formats a percentage value
 * @param value Number to format (0-100)
 * @param decimals Number of decimal places
 * @returns Formatted string
 */
export function formatPercentage(value: number, decimals = 1): string {
  return value.toFixed(decimals) + '%';
}

/**
 * Gets a consistent color for a given label
 * @param label Label to get color for
 * @param palette Color palette to use
 * @returns Hex color code
 */
export function getColorForLabel(label: string, palette: string[] = []): string {
  // Default palette if none provided
  const defaultPalette = [
    '#4e73df', // primary blue
    '#1cc88a', // success green
    '#36b9cc', // info teal
    '#f6c23e', // warning yellow
    '#e74a3b', // danger red
    '#858796', // secondary gray
    '#6f42c1', // purple
    '#20c9a6', // turquoise
    '#ff9800', // orange
    '#f1556c', // pink
  ];
  
  const colorPalette = palette.length > 0 ? palette : defaultPalette;
  
  // Create a hash from the label string
  let hash = 0;
  for (let i = 0; i < label.length; i++) {
    hash = label.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Use the hash to pick a color from the palette
  const index = Math.abs(hash) % colorPalette.length;
  return colorPalette[index];
}

/**
 * Sorts time series data by date
 * @param data Array of time series data points
 * @returns Sorted array
 */
export function sortTimeSeriesData(data: TimeSeriesDataPoint[]): TimeSeriesDataPoint[] {
  return [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

/**
 * Calculates growth percentage between two values
 * @param current Current value
 * @param previous Previous value
 * @returns Growth percentage
 */
export function calculateGrowth(current: number, previous: number): number {
  if (previous === 0) return 0;
  return ((current - previous) / previous) * 100;
}

/**
 * Formats time series data for Chart.js
 * @param data Array of time series data points
 * @returns Object with labels and values arrays
 */
export function formatTimeSeriesForChart(data: TimeSeriesDataPoint[]): { labels: string[], values: number[] } {
  const sorted = sortTimeSeriesData(data);
  return {
    labels: sorted.map(point => point.label),
    values: sorted.map(point => point.value)
  };
}

/**
 * Formats category data for Chart.js
 * @param data Array of category data points
 * @param sort Whether to sort data by value (descending)
 * @returns Object with labels, values and colors arrays
 */
export function formatCategoryDataForChart(
  data: CategoryDataPoint[], 
  sort = true
): { labels: string[], values: number[], colors: string[] } {
  let processed = [...data];
  
  if (sort) {
    processed = processed.sort((a, b) => b.value - a.value);
  }
  
  return {
    labels: processed.map(point => point.category),
    values: processed.map(point => point.value),
    colors: processed.map(point => getColorForLabel(point.category))
  };
}

/**
 * Transforms raw API data into a standard chart format
 * @param data Raw data from API
 * @param labelKey Key for label in data object
 * @param valueKey Key for value in data object
 * @returns Formatted data for charts
 */
export function transformDataForChart(
  data: any[], 
  labelKey: string, 
  valueKey: string
): { labels: string[], values: number[] } {
  return {
    labels: data.map(item => item[labelKey]),
    values: data.map(item => item[valueKey])
  };
}

/**
 * Aggregate data by a specific key
 * @param data Array of objects
 * @param groupKey Key to group by
 * @param valueKey Key for the value to aggregate
 * @param aggregation Aggregation function (sum, avg, max, min)
 * @returns Aggregated data
 */
export function aggregateData(
  data: any[], 
  groupKey: string, 
  valueKey: string, 
  aggregation: 'sum' | 'avg' | 'max' | 'min' = 'sum'
): { label: string, value: number }[] {
  // Group data by the groupKey
  const groups: { [key: string]: any[] } = {};
  data.forEach(item => {
    const key = item[groupKey];
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(item);
  });
  
  // Aggregate values for each group
  const result: { label: string, value: number }[] = [];
  Object.entries(groups).forEach(([key, items]) => {
    let value: number;
    
    switch (aggregation) {
      case 'sum':
        value = items.reduce((sum, item) => sum + (Number(item[valueKey]) || 0), 0);
        break;
      case 'avg':
        value = items.reduce((sum, item) => sum + (Number(item[valueKey]) || 0), 0) / items.length;
        break;
      case 'max':
        value = Math.max(...items.map(item => Number(item[valueKey]) || 0));
        break;
      case 'min':
        value = Math.min(...items.map(item => Number(item[valueKey]) || 0));
        break;
      default:
        value = 0;
    }
    
    result.push({ label: key, value });
  });
  
  return result;
}

/**
 * Generate smart y-axis bounds for charts
 * @param data Array of values
 * @param padding Padding percentage (0-1)
 * @returns Object with min and max values
 */
export function generateAxisBounds(data: number[], padding = 0.1): { min: number, max: number } {
  const min = Math.min(...data);
  const max = Math.max(...data);
  
  // Handle case where all values are the same
  if (min === max) {
    return {
      min: min * 0.9,
      max: max * 1.1
    };
  }
  
  const range = max - min;
  return {
    min: min - (range * padding),
    max: max + (range * padding)
  };
}

/**
 * Round a number to a "nice" value for axis labels
 * @param value Number to round
 * @param round Direction to round (up, down, nearest)
 * @returns Rounded number
 */
export function roundToNiceNumber(value: number, round: 'up' | 'down' | 'nearest' = 'nearest'): number {
  const absValue = Math.abs(value);
  let magnitude = Math.floor(Math.log10(absValue));
  
  // Handle zero or very small numbers
  if (!isFinite(magnitude)) {
    return 0;
  }
  
  const normalizedValue = absValue / Math.pow(10, magnitude);
  let niceValue: number;
  
  if (round === 'up') {
    if (normalizedValue < 1.5) niceValue = 1.5;
    else if (normalizedValue < 2) niceValue = 2;
    else if (normalizedValue < 2.5) niceValue = 2.5;
    else if (normalizedValue < 5) niceValue = 5;
    else niceValue = 10;
  } else if (round === 'down') {
    if (normalizedValue <= 1.5) niceValue = 1;
    else if (normalizedValue <= 2) niceValue = 1.5;
    else if (normalizedValue <= 2.5) niceValue = 2;
    else if (normalizedValue <= 5) niceValue = 2.5;
    else niceValue = 5;
  } else { // nearest
    if (normalizedValue < 1.25) niceValue = 1;
    else if (normalizedValue < 1.75) niceValue = 1.5;
    else if (normalizedValue < 2.25) niceValue = 2;
    else if (normalizedValue < 3.75) niceValue = 2.5;
    else if (normalizedValue < 7.5) niceValue = 5;
    else niceValue = 10;
  }
  
  return niceValue * Math.pow(10, magnitude) * (value < 0 ? -1 : 1);
}