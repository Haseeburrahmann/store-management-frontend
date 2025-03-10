// src/app/features/stores/store-management/store-list/store-list.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { StoreService } from '../../../../core/services/store.service';
import { PermissionService } from '../../../../core/auth/permission.service';
import { Store } from '../../../../shared/models/store.model';
import { HasPermissionDirective } from '../../../../shared/directives/has-permission.directive';

@Component({
  selector: 'app-store-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, HasPermissionDirective],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h1 class="page-title">Store Management</h1>
        <div class="flex flex-col sm:flex-row gap-4">
          <div class="relative">
            <input 
              type="text"
              [(ngModel)]="searchQuery"
              (input)="onSearch()"
              placeholder="Search stores..."
              class="form-control pl-10 pr-4 py-2"
            >
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-[var(--text-secondary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
          
          <button 
            *appHasPermission="'stores:write'"
            routerLink="create" 
            class="btn btn-primary"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            Add New Store
          </button>
        </div>
      </div>
      
      <div class="card">
        <!-- Loading state -->
        <div *ngIf="loading" class="flex justify-center items-center p-8">
          <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500"></div>
        </div>
        
        <!-- Error state -->
        <div *ngIf="error" class="alert alert-danger">
          {{ error }}
        </div>
        
        <!-- Empty state -->
        <div *ngIf="!loading && (!stores || stores.length === 0)" class="text-center py-12">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto text-[var(--text-secondary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <h3 class="mt-4 text-lg font-medium">No stores found</h3>
          <p class="mt-1 text-[var(--text-secondary)]">
            {{ searchQuery ? 'Try adjusting your search query.' : 'Get started by creating a new store.' }}
          </p>
          <div class="mt-6">
            <button 
              *appHasPermission="'stores:write'"
              routerLink="create" 
              class="btn btn-primary"
            >
              Add New Store
            </button>
          </div>
        </div>
        
        <!-- Store table -->
        <div *ngIf="!loading && stores && stores.length > 0" class="overflow-x-auto">
          <table class="min-w-full divide-y divide-[var(--border-color)]">
            <thead>
              <tr>
                <th class="table-header">Store Name</th>
                <th class="table-header">Location</th>
                <th class="table-header">Manager</th>
                <th class="table-header">Status</th>
                <th class="table-header">Phone</th>
                <th class="table-header">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[var(--border-color)]">
              <tr *ngFor="let store of stores" class="table-row">
                <td class="table-cell font-medium">{{ store.name }}</td>
                <td class="table-cell">{{ store.city }}, {{ store.state }}</td>
                <td class="table-cell">
                  <span *ngIf="store.manager_name">{{ store.manager_name }}</span>
                  <span *ngIf="!store.manager_name" class="text-slate-400 dark:text-slate-500">Not assigned</span>
                </td>
                <td class="table-cell">
                  <span 
                    class="inline-flex items-center"
                    [class]="store.is_active ? 'text-green-500' : 'text-red-500'"
                  >
                    <span class="h-2 w-2 rounded-full mr-1.5" [class]="store.is_active ? 'bg-green-500' : 'bg-red-500'"></span>
                    {{ store.is_active ? 'Active' : 'Inactive' }}
                  </span>
                </td>
                <td class="table-cell">{{ store.phone }}</td>
                <td class="table-cell">
                  <div class="flex items-center space-x-2">
                    <a 
                      [routerLink]="[store._id]"
                      class="btn btn-sm btn-outline text-slate-600 dark:text-slate-300"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      <span class="sr-only">View</span>
                    </a>
                    
                    <a 
                      *appHasPermission="'stores:write'"
                      [routerLink]="[store._id, 'edit']"
                      class="btn btn-sm btn-outline text-blue-600 dark:text-blue-400"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      <span class="sr-only">Edit</span>
                    </a>
                    
                    <button 
                      *appHasPermission="'stores:delete'"
                      (click)="onDeleteStore(store)"
                      class="btn btn-sm btn-outline text-red-600 dark:text-red-400"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      <span class="sr-only">Delete</span>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <!-- Pagination -->
        <div *ngIf="!loading && stores && stores.length > 0" class="px-6 py-4 flex items-center justify-between border-t border-[var(--border-color)]">
          <div>
            <p class="text-sm text-[var(--text-secondary)]">
              Showing <span class="font-medium">{{ (currentPage - 1) * pageSize + 1 }}</span> to 
              <span class="font-medium">{{ Math.min(currentPage * pageSize, totalStores) }}</span> of 
              <span class="font-medium">{{ totalStores }}</span> results
            </p>
          </div>
          
          <nav class="flex items-center space-x-2">
            <button 
              (click)="goToPage(currentPage - 1)"
              [disabled]="currentPage === 1"
              class="btn btn-sm btn-outline text-[var(--text-secondary)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            
            <!-- Page numbers - simplified for now -->
            <div class="flex items-center space-x-1">
              <button 
                *ngFor="let page of getPageNumbers()"
                (click)="goToPage(page)"
                class="btn btn-sm rounded-md w-10"
                [class.btn-primary]="page === currentPage"
                [class.btn-outline]="page !== currentPage"
              >
                {{ page }}
              </button>
            </div>
            
            <button 
              (click)="goToPage(currentPage + 1)"
              [disabled]="currentPage >= Math.ceil(totalStores / pageSize)"
              class="btn btn-sm btn-outline text-[var(--text-secondary)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </nav>
        </div>
      </div>
    </div>
  `
})
export class StoreListComponent implements OnInit {
  stores: Store[] = [];
  loading = true;
  error = '';
  
  // Pagination
  currentPage = 1;
  pageSize = 10;
  totalStores = 0;
  
  // Search
  searchQuery = '';
  searchTimeout: any;
  
  // For template use
  Math = Math;
  
  constructor(
    private storeService: StoreService,
    private permissionService: PermissionService
  ) {}
  
  ngOnInit(): void {
    this.loadStores();
  }
  
  loadStores(): void {
    this.loading = true;
    this.error = '';
    
    const skip = (this.currentPage - 1) * this.pageSize;
    const options: any = {
      skip: skip,
      limit: this.pageSize
    };
    
    if (this.searchQuery) {
      options.name = this.searchQuery;
    }
    
    this.storeService.getStores(options).subscribe({
      next: (stores) => {
        this.stores = stores;
        this.totalStores = stores.length > 0 ? skip + stores.length + (stores.length === this.pageSize ? 1 : 0) : 0;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load stores. Please try again later.';
        this.loading = false;
        console.error('Error loading stores:', err);
      }
    });
  }
  
  onSearch(): void {
    // Debounce search to avoid too many API calls
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
    
    this.searchTimeout = setTimeout(() => {
      this.currentPage = 1; // Reset to first page when searching
      this.loadStores();
    }, 300);
  }
  
  goToPage(page: number): void {
    if (page < 1 || page > Math.ceil(this.totalStores / this.pageSize)) {
      return;
    }
    
    this.currentPage = page;
    this.loadStores();
  }
  
  getPageNumbers(): number[] {
    const totalPages = Math.ceil(this.totalStores / this.pageSize);
    const visiblePages = 5; // Number of page buttons to show
    
    // Calculate start and end page
    let startPage = Math.max(1, this.currentPage - Math.floor(visiblePages / 2));
    let endPage = startPage + visiblePages - 1;
    
    // Adjust if we're near the end
    if (endPage > totalPages) {
      endPage = totalPages;
      startPage = Math.max(1, endPage - visiblePages + 1);
    }
    
    // Generate array of page numbers
    return Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);
  }
  
  onDeleteStore(store: Store): void {
    if (!confirm(`Are you sure you want to delete ${store.name}?`)) {
      return;
    }
    
    this.storeService.deleteStore(store._id).subscribe({
      next: (success) => {
        if (success) {
          this.stores = this.stores.filter(s => s._id !== store._id);
          // Reload if the last item on the page was deleted
          if (this.stores.length === 0 && this.currentPage > 1) {
            this.currentPage--;
            this.loadStores();
          }
        } else {
          this.error = 'Failed to delete store.';
        }
      },
      error: (err) => {
        this.error = 'Failed to delete store. Please try again later.';
        console.error('Error deleting store:', err);
      }
    });
  }
}