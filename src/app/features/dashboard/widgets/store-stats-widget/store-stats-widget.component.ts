// src/app/features/dashboard/widgets/store-stats-widget.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { StoreService } from '../../../../core/services/store.service';
import { PermissionService } from '../../../../core/auth/permission.service';

@Component({
  selector: 'app-store-stats-widget',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-hidden">
      <div class="p-5">
        <div class="flex items-center">
          <div class="flex-shrink-0 bg-amber-100 dark:bg-amber-900 rounded-md p-3">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-amber-600 dark:text-amber-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <div class="ml-5 w-0 flex-1">
            <dl>
              <dt class="text-sm font-medium text-slate-500 dark:text-slate-400 truncate">Active Stores</dt>
              <dd class="flex items-baseline">
                <div *ngIf="!loading" class="text-2xl font-semibold text-slate-900 dark:text-white">{{ activeStoreCount }}</div>
                <div *ngIf="loading" class="text-2xl font-semibold text-slate-400 dark:text-slate-500">...</div>
                <div *ngIf="!loading && totalStores > 0" class="ml-2 flex items-baseline text-sm font-semibold text-green-600 dark:text-green-500">
                  <span>{{ percentageActive }}%</span>
                </div>
              </dd>
            </dl>
          </div>
        </div>
      </div>
      <div class="bg-slate-50 dark:bg-slate-700 px-5 py-3">
        <div class="text-sm">
          <a routerLink="/stores" class="font-medium text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white">View all stores</a>
        </div>
      </div>
    </div>
  `
})
export class StoreStatsWidgetComponent implements OnInit {
  activeStoreCount = 0;
  totalStores = 0;
  loading = true;
  percentageActive = 0;
  
  constructor(
    private storeService: StoreService,
    private permissionService: PermissionService
  ) {}
  
  ngOnInit(): void {
    // Only load data if user has permission to view stores
    if (this.permissionService.hasPermission('stores:read')) {
      this.loadStoreStats();
    } else {
      this.loading = false;
    }
  }
  
  loadStoreStats(): void {
    this.storeService.getStores().subscribe({
      next: (stores) => {
        this.totalStores = stores.length;
        this.activeStoreCount = stores.filter(store => store.is_active).length;
        
        // Calculate percentage of active stores
        if (this.totalStores > 0) {
          this.percentageActive = Math.round((this.activeStoreCount / this.totalStores) * 100);
        }
        
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading store stats:', err);
        this.loading = false;
      }
    });
  }
}