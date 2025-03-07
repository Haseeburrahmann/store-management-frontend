// src/app/core/config/analytics-config.ts
import { AnalyticsConfig } from '../models/analytics.model';

/**
 * Configuration settings for the analytics module
 */
export const ANALYTICS_CONFIG: AnalyticsConfig = {
  // How often to automatically refresh analytics data (15 minutes)
  refreshInterval: 15 * 60 * 1000,
  
  // Default timeframe for analytics views
  defaultTimeframe: 'monthly',
  
  // Chart color palettes
  chartColors: {
    // Primary color scheme (blues)
    primary: [
      '#4e73df', '#3a66d6', '#2759cc', '#134cc3', '#003fb9'
    ],
    
    // Secondary color scheme (purples)
    secondary: [
      '#6f42c1', '#5d37a2', '#4c2d83', '#3a2264', '#291845'
    ],
    
    // Success color scheme (greens)
    success: [
      '#1cc88a', '#19ad76', '#169262', '#13774d', '#0f5c39'
    ],
    
    // Warning color scheme (yellows/oranges)
    warning: [
      '#f6c23e', '#f5b622', '#e5a60f', '#c68e0d', '#a6780b'
    ],
    
    // Danger color scheme (reds)
    danger: [
      '#e74a3b', '#e32c1c', '#c42919', '#a52215', '#871c12'
    ]
  },
  
  // Available export formats
  exportFormats: ['csv', 'json']
};

/**
 * Get a color scheme based on the theme name
 * @param theme Theme name (primary, secondary, success, warning, danger)
 * @returns Array of colors for the theme
 */
export function getColorScheme(theme: keyof AnalyticsConfig['chartColors']): string[] {
  return ANALYTICS_CONFIG.chartColors[theme] || ANALYTICS_CONFIG.chartColors.primary;
}

/**
 * Generate a gradient color array based on a starting color
 * @param baseColor Base color in hex format (#RRGGBB)
 * @param steps Number of gradient steps to generate
 * @returns Array of gradient colors
 */
export function generateColorGradient(baseColor: string, steps: number): string[] {
  const result: string[] = [];
  
  // Convert hex to RGB
  const r = parseInt(baseColor.substring(1, 3), 16);
  const g = parseInt(baseColor.substring(3, 5), 16);
  const b = parseInt(baseColor.substring(5, 7), 16);
  
  for (let i = 0; i < steps; i++) {
    // Calculate gradient factor (0 to 1)
    const factor = i / (steps - 1);
    
    // Darken the color proportionally
    const newR = Math.round(r * (1 - factor * 0.5));
    const newG = Math.round(g * (1 - factor * 0.5));
    const newB = Math.round(b * (1 - factor * 0.5));
    
    // Convert back to hex and add to result
    result.push(
      `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`
    );
  }
  
  return result;
}

/**
 * Generate random but visually distinct colors
 * @param count Number of colors to generate
 * @returns Array of colors
 */
export function generateDistinctColors(count: number): string[] {
  const colors: string[] = [];
  const goldenRatioConjugate = 0.618033988749895;
  let h = Math.random();
  
  for (let i = 0; i < count; i++) {
    h += goldenRatioConjugate;
    h %= 1;
    
    const hue = Math.floor(h * 360);
    const saturation = 70 + Math.random() * 10; // 70-80%
    const lightness = 45 + Math.random() * 10; // 45-55%
    
    colors.push(`hsl(${hue}, ${saturation}%, ${lightness}%)`);
  }
  
  return colors;
}