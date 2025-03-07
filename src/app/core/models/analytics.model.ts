// src/app/core/models/analytics.model.ts
/**
 * Analytics timeframe options
 */
export type AnalyticsTimeframe = 'daily' | 'weekly' | 'monthly' | 'yearly';

/**
 * Data point structure for time-series data
 */
export interface TimeSeriesDataPoint {
  label: string;
  value: number;
  date: string;
}

/**
 * Category data point structure
 */
export interface CategoryDataPoint {
  category: string;
  value: number;
  percentage: number;
}

/**
 * Product analytics data structure
 */
export interface ProductAnalytics {
  productId: number;
  productName: string;
  quantity: number;
  revenue: number;
  profit: number;
}

/**
 * Employee performance data structure
 */
export interface EmployeePerformance {
  employeeId: number;
  name: string;
  performance: number;
  sales: number;
  customersServed: number;
}

/**
 * Department performance data structure
 */
export interface DepartmentPerformance {
  department: string;
  averagePerformance: number;
  totalSales: number;
  employeeCount: number;
}

/**
 * Sales analytics data structure
 */
export interface SalesAnalytics {
  totalSales: number;
  averageOrderValue: number;
  topSellingProducts: ProductAnalytics[];
  salesByPeriod: TimeSeriesDataPoint[];
  salesByCategory: CategoryDataPoint[];
  salesTrend: TimeSeriesDataPoint[];
}

/**
 * Inventory analytics data structure
 */
export interface InventoryAnalytics {
  totalItems: number;
  lowStockItems: {
    productId: number;
    productName: string;
    currentStock: number;
    reorderLevel: number;
  }[];
  inventoryValue: number;
  inventoryTurnover: number;
  stockByCategory: CategoryDataPoint[];
  inventoryTrend: TimeSeriesDataPoint[];
}

/**
 * Employee analytics data structure
 */
export interface EmployeeAnalytics {
  totalEmployees: number;
  averagePerformance: number;
  topPerformers: EmployeePerformance[];
  performanceByDepartment: DepartmentPerformance[];
  attendanceRate: number;
  productivityTrend: TimeSeriesDataPoint[];
}

/**
 * Combined analytics data for dashboard
 */
export interface AnalyticsData {
  sales: SalesAnalytics;
  inventory: InventoryAnalytics;
  employees: EmployeeAnalytics;
}

/**
 * Analytics config options
 */
export interface AnalyticsConfig {
  refreshInterval: number; // milliseconds
  defaultTimeframe: AnalyticsTimeframe;
  chartColors: {
    primary: string[];
    secondary: string[];
    success: string[];
    warning: string[];
    danger: string[];
  };
  exportFormats: ('csv' | 'json' | 'pdf')[];
}