// src/app/core/services/analytics.service.ts
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map, shareReplay, tap } from 'rxjs/operators';
import { ApiService } from './api.service';
import { CacheService } from './cache.service';
import { ErrorService } from './error.service';
import { NotificationService } from './notification.service';
import { AnalyticsData, SalesAnalytics, InventoryAnalytics, EmployeeAnalytics, AnalyticsTimeframe } from '../models/analytics.model';

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  private readonly CACHE_KEY_PREFIX = 'analytics_';
  private readonly CACHE_DURATION = 15 * 60 * 1000; // 15 minutes

  constructor(
    private apiService: ApiService,
    private cacheService: CacheService,
    private errorService: ErrorService,
    private notificationService: NotificationService
  ) {}

  /**
   * Get aggregated sales analytics data
   * @param storeId Optional store ID for filtered analytics
   * @param timeframe Analytics timeframe (daily, weekly, monthly, yearly)
   * @returns Observable with sales analytics data
   */
  getSalesAnalytics(timeframe: AnalyticsTimeframe, storeId?: number): Observable<SalesAnalytics> {
    const endpoint = storeId 
      ? `/analytics/sales/${timeframe}/${storeId}` 
      : `/analytics/sales/${timeframe}`;
    
    const cacheKey = `${this.CACHE_KEY_PREFIX}sales_${timeframe}_${storeId || 'all'}`;
    
    const cachedData = this.cacheService.get<SalesAnalytics>(cacheKey);
    if (cachedData) {
      return of(cachedData);
    }
    
    return this.apiService.get<SalesAnalytics>(endpoint).pipe(
      tap(data => this.cacheService.set(cacheKey, data, this.CACHE_DURATION)),
      catchError(error => {
        this.errorService.handleError('Failed to load sales analytics', error);
        return of({
          totalSales: 0,
          averageOrderValue: 0,
          topSellingProducts: [],
          salesByPeriod: [],
          salesByCategory: [],
          salesTrend: []
        } as SalesAnalytics);
      }),
      shareReplay(1)
    );
  }

  /**
   * Get aggregated inventory analytics data
   * @param storeId Optional store ID for filtered analytics
   * @param timeframe Analytics timeframe (daily, weekly, monthly, yearly)
   * @returns Observable with inventory analytics data
   */
  getInventoryAnalytics(timeframe: AnalyticsTimeframe, storeId?: number): Observable<InventoryAnalytics> {
    const endpoint = storeId 
      ? `/analytics/inventory/${timeframe}/${storeId}` 
      : `/analytics/inventory/${timeframe}`;
    
    const cacheKey = `${this.CACHE_KEY_PREFIX}inventory_${timeframe}_${storeId || 'all'}`;
    
    const cachedData = this.cacheService.get<InventoryAnalytics>(cacheKey);
    if (cachedData) {
      return of(cachedData);
    }
    
    return this.apiService.get<InventoryAnalytics>(endpoint).pipe(
      tap(data => this.cacheService.set(cacheKey, data, this.CACHE_DURATION)),
      catchError(error => {
        this.errorService.handleError('Failed to load inventory analytics', error);
        return of({
          totalItems: 0,
          lowStockItems: [],
          inventoryValue: 0,
          inventoryTurnover: 0,
          stockByCategory: [],
          inventoryTrend: []
        } as InventoryAnalytics);
      }),
      shareReplay(1)
    );
  }

  /**
   * Get aggregated employee analytics data
   * @param storeId Optional store ID for filtered analytics
   * @param timeframe Analytics timeframe (daily, weekly, monthly, yearly)
   * @returns Observable with employee analytics data
   */
  getEmployeeAnalytics(timeframe: AnalyticsTimeframe, storeId?: number): Observable<EmployeeAnalytics> {
    const endpoint = storeId 
      ? `/analytics/employees/${timeframe}/${storeId}` 
      : `/analytics/employees/${timeframe}`;
    
    const cacheKey = `${this.CACHE_KEY_PREFIX}employees_${timeframe}_${storeId || 'all'}`;
    
    const cachedData = this.cacheService.get<EmployeeAnalytics>(cacheKey);
    if (cachedData) {
      return of(cachedData);
    }
    
    return this.apiService.get<EmployeeAnalytics>(endpoint).pipe(
      tap(data => this.cacheService.set(cacheKey, data, this.CACHE_DURATION)),
      catchError(error => {
        this.errorService.handleError('Failed to load employee analytics', error);
        return of({
          totalEmployees: 0,
          averagePerformance: 0,
          topPerformers: [],
          performanceByDepartment: [],
          attendanceRate: 0,
          productivityTrend: []
        } as EmployeeAnalytics);
      }),
      shareReplay(1)
    );
  }

  /**
   * Get comprehensive dashboard analytics
   * @param storeId Optional store ID for filtered analytics
   * @param timeframe Analytics timeframe (daily, weekly, monthly, yearly)
   * @returns Observable with combined analytics data
   */
  getDashboardAnalytics(timeframe: AnalyticsTimeframe, storeId?: number): Observable<AnalyticsData> {
    const cacheKey = `${this.CACHE_KEY_PREFIX}dashboard_${timeframe}_${storeId || 'all'}`;
    
    const cachedData = this.cacheService.get<AnalyticsData>(cacheKey);
    if (cachedData) {
      return of(cachedData);
    }
    
    return this.apiService.get<AnalyticsData>(`/analytics/dashboard/${timeframe}${storeId ? '/' + storeId : ''}`).pipe(
      tap(data => this.cacheService.set(cacheKey, data, this.CACHE_DURATION)),
      catchError(error => {
        this.errorService.handleError('Failed to load dashboard analytics', error);
        return of({
          sales: {
            totalSales: 0,
            averageOrderValue: 0,
            topSellingProducts: [],
            salesByPeriod: [],
            salesByCategory: [],
            salesTrend: []
          },
          inventory: {
            totalItems: 0,
            lowStockItems: [],
            inventoryValue: 0,
            inventoryTurnover: 0,
            stockByCategory: [],
            inventoryTrend: []
          },
          employees: {
            totalEmployees: 0,
            averagePerformance: 0,
            topPerformers: [],
            performanceByDepartment: [],
            attendanceRate: 0,
            productivityTrend: []
          }
        } as AnalyticsData);
      }),
      shareReplay(1)
    );
  }

  /**
   * Clear analytics cache
   * @param specificKey Optional specific cache key to clear
   */
  clearAnalyticsCache(specificKey?: string): void {
    if (specificKey) {
      this.cacheService.remove(`${this.CACHE_KEY_PREFIX}${specificKey}`);
      this.notificationService.success('Analytics cache refreshed');
    } else {
      this.cacheService.remove(this.CACHE_KEY_PREFIX);
      this.notificationService.success('All analytics cache refreshed');
    }
  }

  /**
   * Export analytics data in CSV format
   * @param analyticsData Data to export
   * @param filename Export filename
   */
  exportAnalytics(analyticsData: any, filename: string): void {
    try {
      // Convert data to CSV format
      const csvData = this.convertToCSV(analyticsData);
      
      // Create download link
      const blob = new Blob([csvData], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.setAttribute('hidden', '');
      a.setAttribute('href', url);
      a.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(a);
      
      // Trigger download and cleanup
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      this.notificationService.showSuccess('Analytics data exported successfully');
    } catch (error) {
      this.errorService.handleError('Failed to export analytics data', error);
    }
  }

  /**
   * Helper method to convert data to CSV format
   * @param data Data to convert
   * @returns CSV formatted string
   */
  private convertToCSV(data: any): string {
    if (!data || Object.keys(data).length === 0) {
      return '';
    }
    
    // Handle array data
    if (Array.isArray(data)) {
      const headers = Object.keys(data[0]).join(',');
      const rows = data.map(item => 
        Object.values(item).map(value => 
          typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value
        ).join(',')
      );
      
      return [headers, ...rows].join('\n');
    }
    
    // Handle object data
    const rows = [];
    for (const [key, value] of Object.entries(data)) {
      if (typeof value !== 'object') {
        rows.push(`"${key}","${value}"`);
      } else if (Array.isArray(value)) {
        // For nested arrays, create a separate section
        rows.push(`"${key} (${value.length} items)"`);
        if (value.length > 0 && typeof value[0] === 'object') {
          const subHeaders = Object.keys(value[0]).join(',');
          rows.push(subHeaders);
          value.forEach(item => {
            rows.push(Object.values(item).join(','));
          });
        }
      }
    }
    
    return rows.join('\n');
  }
}