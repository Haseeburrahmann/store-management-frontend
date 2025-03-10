// src/app/features/stores/store-management/store-detail/store-detail.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { StoreService } from '../../../../core/services/store.service';
import { UserService } from '../../../../core/services/user.service';
import { PermissionService } from '../../../../core/auth/permission.service';
import { Store } from '../../../../shared/models/store.model';
import { User } from '../../../../shared/models/user.model';
import { HasPermissionDirective } from '../../../../shared/directives/has-permission.directive';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-store-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, HasPermissionDirective, FormsModule],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h1 class="page-title">Store Details</h1>
        <div class="flex flex-col sm:flex-row gap-4">
          <button routerLink="/stores" class="btn btn-outline flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Stores
          </button>
          
          <button 
            *appHasPermission="'stores:write'"
            [routerLink]="['/stores', storeId, 'edit']" 
            class="btn btn-primary flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit Store
          </button>
        </div>
      </div>

      <!-- Loading state -->
      <div *ngIf="loading" class="flex justify-center items-center p-8">
        <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500"></div>
      </div>
      
      <!-- Error state -->
      <div *ngIf="error" class="alert alert-danger mb-6">
        {{ error }}
      </div>
      
      <!-- Store details -->
      <div *ngIf="store && !loading" class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Store overview card -->
        <div class="card col-span-1">
          <div class="flex flex-col">
            <!-- Store icon -->
            <div class="mx-auto h-20 w-20 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-slate-500 dark:text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            
            <!-- Store info -->
            <h2 class="text-xl font-bold text-center">{{ store.name }}</h2>
            <p class="text-sm text-center text-[var(--text-secondary)] mb-2">{{ store.address }}</p>
            <p class="text-sm text-center text-[var(--text-secondary)]">{{ store.city }}, {{ store.state }} {{ store.zip_code }}</p>
            
            <!-- Status indicator -->
            <div class="mt-4 flex justify-center">
              <span 
                class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                [ngClass]="store.is_active ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'"
              >
                <span class="h-2 w-2 rounded-full mr-1.5" [ngClass]="store.is_active ? 'bg-green-500' : 'bg-red-500'"></span>
                {{ store.is_active ? 'Active' : 'Inactive' }}
              </span>
            </div>
            
            <!-- Contact info -->
            <div class="w-full mt-6 pt-6 border-t border-[var(--border-color)]">
              <div class="grid grid-cols-1 gap-4">
                <div class="flex flex-col">
                  <span class="text-xs text-[var(--text-secondary)]">Phone</span>
                  <span>{{ store.phone }}</span>
                </div>
                <div class="flex flex-col">
                  <span class="text-xs text-[var(--text-secondary)]">Email</span>
                  <span>{{ store.email || 'Not provided' }}</span>
                </div>
                <div class="flex flex-col">
                  <span class="text-xs text-[var(--text-secondary)]">Manager</span>
                  <span>{{ store.manager_name || 'Not assigned' }}</span>
                </div>
                <div class="flex flex-col">
                  <span class="text-xs text-[var(--text-secondary)]">Created At</span>
                  <span>{{ store.created_at | date:'mediumDate' }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Store information and management -->
        <div class="card col-span-1 lg:col-span-2">
          <h2 class="text-xl font-bold mb-6">Store Information</h2>
          
          <div class="space-y-6">
            <!-- Address Information -->
            <div class="border border-[var(--border-color)] rounded-lg overflow-hidden">
              <div class="px-4 py-3 bg-[var(--bg-main)] border-b border-[var(--border-color)]">
                <h3 class="text-md font-medium">Address Information</h3>
              </div>
              <div class="p-4 space-y-4">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label class="text-xs text-[var(--text-secondary)]">Store Name</label>
                    <div class="mt-1 p-2 bg-[var(--bg-main)] rounded">{{ store.name }}</div>
                  </div>
                  <div>
                    <label class="text-xs text-[var(--text-secondary)]">Address</label>
                    <div class="mt-1 p-2 bg-[var(--bg-main)] rounded">{{ store.address }}</div>
                  </div>
                  <div>
                    <label class="text-xs text-[var(--text-secondary)]">City</label>
                    <div class="mt-1 p-2 bg-[var(--bg-main)] rounded">{{ store.city }}</div>
                  </div>
                  <div>
                    <label class="text-xs text-[var(--text-secondary)]">State</label>
                    <div class="mt-1 p-2 bg-[var(--bg-main)] rounded">{{ store.state }}</div>
                  </div>
                  <div>
                    <label class="text-xs text-[var(--text-secondary)]">Zip Code</label>
                    <div class="mt-1 p-2 bg-[var(--bg-main)] rounded">{{ store.zip_code }}</div>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Manager Assignment (for admins and managers) -->
            <div *appHasPermission="'stores:write'" class="border border-[var(--border-color)] rounded-lg overflow-hidden">
              <div class="px-4 py-3 bg-[var(--bg-main)] border-b border-[var(--border-color)]">
                <h3 class="text-md font-medium">Manager Assignment</h3>
              </div>
              <div class="p-4">
                <p class="text-sm mb-4">Assign a manager to this store to oversee its operations.</p>
                
                <div class="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
                  <div class="flex-grow">
                    <select 
                      [(ngModel)]="selectedManagerId"
                      class="form-control w-full"
                    >
                      <option value="">Select a manager</option>
                      <option *ngFor="let manager of availableManagers" [value]="manager._id">
                        {{ manager.full_name }} ({{ manager.email }})
                      </option>
                    </select>
                  </div>
                  <button 
                    (click)="assignManager()"
                    class="btn btn-primary"
                    [disabled]="!selectedManagerId || assigningManager"
                  >
                    <span *ngIf="assigningManager" class="mr-2">
                      <svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    </span>
                    Assign Manager
                  </button>
                </div>
                
                <div *ngIf="managerUpdateMessage" class="mt-4" [ngClass]="{'alert-success': !managerUpdateError, 'alert-danger': managerUpdateError}" class="alert">
                  {{ managerUpdateMessage }}
                </div>
              </div>
            </div>
            
            <!-- Store Status (for admins and assigned managers) -->
            <div *appHasPermission="'stores:write'" class="border border-[var(--border-color)] rounded-lg overflow-hidden">
              <div class="px-4 py-3 bg-[var(--bg-main)] border-b border-[var(--border-color)]">
                <h3 class="text-md font-medium">Store Status</h3>
              </div>
              <div class="p-4">
                <div class="flex items-center justify-between">
                  <div>
                    <p class="font-medium">
                      {{ store.is_active ? 'This store is active' : 'This store is inactive' }}
                    </p>
                    <p class="text-sm text-[var(--text-secondary)]">
                      {{ store.is_active ? 'The store is open and operational.' : 'The store is currently closed.' }}
                    </p>
                  </div>
                  <button 
                    (click)="toggleStoreStatus()"
                    [class]="store.is_active ? 'btn btn-danger' : 'btn btn-success'"
                  >
                    {{ store.is_active ? 'Deactivate Store' : 'Activate Store' }}
                  </button>
                </div>
                
                <div *ngIf="statusUpdateMessage" class="mt-4" [ngClass]="{'alert-success': !statusUpdateError, 'alert-danger': statusUpdateError}" class="alert">
                  {{ statusUpdateMessage }}
                </div>
              </div>
            </div>
            
            <!-- Danger Zone (for admins only) -->
            <div *appHasPermission="'stores:delete'" class="border border-red-300 dark:border-red-700 rounded-lg overflow-hidden">
              <div class="px-4 py-3 bg-red-50 dark:bg-red-900/30 border-b border-red-300 dark:border-red-700">
                <h3 class="text-md font-medium text-red-800 dark:text-red-300">Danger Zone</h3>
              </div>
              <div class="p-4">
                <div class="flex items-center justify-between">
                  <div>
                    <p class="font-medium">Delete this store</p>
                    <p class="text-sm text-[var(--text-secondary)]">
                      Once deleted, all data will be permanently removed and cannot be recovered.
                    </p>
                  </div>
                  <button 
                    (click)="deleteStore()"
                    class="btn btn-danger"
                  >
                    Delete Store
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class StoreDetailComponent implements OnInit {
  storeId: string = '';
  store: Store | null = null;
  loading = true;
  error = '';
  
  // Available managers for assignment
  availableManagers: User[] = [];
  selectedManagerId: string = '';
  
  // Manager assignment
  assigningManager = false;
  managerUpdateMessage = '';
  managerUpdateError = false;
  
  // Status management
  statusUpdateMessage = '';
  statusUpdateError = false;
  
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private storeService: StoreService,
    private userService: UserService,
    private permissionService: PermissionService
  ) {}
  
  ngOnInit(): void {
    this.storeId = this.route.snapshot.paramMap.get('id') || '';
    this.loadStore();
    
    // Load available managers (users with 'Manager' role) if user has permission
    if (this.permissionService.hasPermission('stores:write')) {
      this.loadManagers();
    }
  }
  
  loadStore(): void {
    this.loading = true;
    this.error = '';
    
    if (!this.storeId) {
      this.error = 'Store ID is required';
      this.loading = false;
      return;
    }
    
    this.storeService.getStoreById(this.storeId).subscribe({
      next: (store) => {
        this.store = store;
        this.selectedManagerId = store.manager_id || '';
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load store. Please try again later.';
        this.loading = false;
        console.error('Error loading store:', err);
      }
    });
  }
  
  loadManagers(): void {
    // Get users with Manager role
    this.userService.getUsers({ role_id: '67c9fb4d9db05f47c32b6b23' }).subscribe({
      next: (managers) => {
        this.availableManagers = managers;
      },
      error: (err) => {
        console.error('Error loading managers:', err);
      }
    });
  }
  
  assignManager(): void {
    if (!this.store || !this.selectedManagerId) {
      return;
    }
    
    this.assigningManager = true;
    this.managerUpdateMessage = '';
    this.managerUpdateError = false;
    
    this.storeService.assignManager(this.storeId, this.selectedManagerId).subscribe({
      next: (updatedStore) => {
        this.store = updatedStore;
        
        // Update manager name display
        const manager = this.availableManagers.find(m => m._id === this.selectedManagerId);
        if (manager) {
          this.store.manager_name = manager.full_name;
        }
        
        this.managerUpdateMessage = 'Manager assigned successfully.';
        this.managerUpdateError = false;
        this.assigningManager = false;
        
        setTimeout(() => {
          this.managerUpdateMessage = '';
        }, 3000);
      },
      error: (err) => {
        this.managerUpdateMessage = 'Failed to assign manager. Please try again later.';
        this.managerUpdateError = true;
        this.assigningManager = false;
        console.error('Error assigning manager:', err);
      }
    });
  }
  
  toggleStoreStatus(): void {
    if (!this.store) {
      return;
    }
    
    const newStatus = !this.store.is_active;
    const actionText = newStatus ? 'activate' : 'deactivate';
    
    if (!confirm(`Are you sure you want to ${actionText} this store?`)) {
      return;
    }
    
    this.statusUpdateMessage = '';
    this.statusUpdateError = false;
    
    this.storeService.updateStore(this.storeId, { is_active: newStatus }).subscribe({
      next: (updatedStore) => {
        this.store = updatedStore;
        this.statusUpdateMessage = `Store ${newStatus ? 'activated' : 'deactivated'} successfully.`;
        this.statusUpdateError = false;
        setTimeout(() => {
          this.statusUpdateMessage = '';
        }, 3000);
      },
      error: (err) => {
        this.statusUpdateMessage = `Failed to ${actionText} store. Please try again later.`;
        this.statusUpdateError = true;
        console.error('Error updating store status:', err);
      }
    });
  }
  
  deleteStore(): void {
    if (!this.store) {
      return;
    }
    
    if (!confirm(`Are you sure you want to delete ${this.store.name}? This action cannot be undone.`)) {
      return;
    }
    
    this.storeService.deleteStore(this.storeId).subscribe({
      next: (success) => {
        if (success) {
          this.router.navigate(['/stores']);
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