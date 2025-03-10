// src/app/features/employees/employee-management/employee-list/employee-list.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { EmployeeService } from '../../../../core/services/employee.service';
import { StoreService } from '../../../../core/services/store.service';
import { PermissionService } from '../../../../core/auth/permission.service';
import { Employee } from '../../../../shared/models/employee.model';
import { Store } from '../../../../shared/models/store.model';
import { HasPermissionDirective } from '../../../../shared/directives/has-permission.directive';

@Component({
  selector: 'app-employee-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, HasPermissionDirective],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h1 class="page-title">Employee Management</h1>
        <div class="flex flex-col sm:flex-row gap-4">
          <div class="relative">
            <input 
              type="text"
              [(ngModel)]="searchQuery"
              (input)="onSearch()"
              placeholder="Search employees..."
              class="form-control pl-10 pr-4 py-2"
            >
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-[var(--text-secondary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
          
          <!-- Store Filter -->
          <div class="relative">
            <select 
              [(ngModel)]="selectedStoreId" 
              (change)="onFilterChange()" 
              class="form-control pl-10 pr-4 py-2"
            >
              <option value="">All Stores</option>
              <option *ngFor="let store of stores" [value]="store._id">{{ store.name }}</option>
            </select>
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-[var(--text-secondary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
          </div>
          
          <!-- Status Filter -->
          <div class="relative">
            <select 
              [(ngModel)]="selectedStatus" 
              (change)="onFilterChange()" 
              class="form-control pl-10 pr-4 py-2"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="on_leave">On Leave</option>
              <option value="terminated">Terminated</option>
            </select>
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-[var(--text-secondary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4" />
              </svg>
            </div>
          </div>
          
          <button 
            *appHasPermission="'employees:write'"
            routerLink="create" 
            class="btn btn-primary"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            Add New Employee
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
        <div *ngIf="!loading && (!employees || employees.length === 0)" class="text-center py-12">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto text-[var(--text-secondary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <h3 class="mt-4 text-lg font-medium">No employees found</h3>
          <p class="mt-1 text-[var(--text-secondary)]">
            {{ searchQuery || selectedStoreId || selectedStatus ? 'Try adjusting your search or filters.' : 'Get started by creating a new employee.' }}
          </p>
          <div class="mt-6">
            <button 
              *appHasPermission="'employees:write'"
              routerLink="create" 
              class="btn btn-primary"
            >
              Add New Employee
            </button>
          </div>
        </div>
        
        <!-- Employee table -->
        <div *ngIf="!loading && employees && employees.length > 0" class="overflow-x-auto">
          <table class="min-w-full divide-y divide-[var(--border-color)]">
            <thead>
              <tr>
                <th class="table-header">Employee</th>
                <th class="table-header">Position</th>
                <th class="table-header">Store</th>
                <th class="table-header">Status</th>
                <th class="table-header">Hire Date</th>
                <th class="table-header">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[var(--border-color)]">
              <tr *ngFor="let employee of employees" class="table-row">
                <td class="table-cell">
                  <div class="flex items-center">
                    <div class="h-8 w-8 rounded-full bg-slate-600 dark:bg-slate-700 flex items-center justify-center text-white font-semibold mr-3">
                      {{ getEmployeeInitials(employee) }}
                    </div>
                    <div>
                      <div class="font-medium">{{ employee.full_name || 'Unknown' }}</div>
                      <div *ngIf="employee.email" class="text-xs text-[var(--text-secondary)]">{{ employee.email }}</div>
                    </div>
                  </div>
                </td>
                <td class="table-cell">{{ employee.position }}</td>
                <td class="table-cell">
                  <span *ngIf="employee.store_name">{{ employee.store_name }}</span>
                  <span *ngIf="!employee.store_name" class="text-slate-400 dark:text-slate-500">Not assigned</span>
                </td>
                <td class="table-cell">
                  <span 
                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                    [ngClass]="getStatusBadgeClass(employee.employment_status)"
                  >
                    {{ getStatusLabel(employee.employment_status) }}
                  </span>
                </td>
                <td class="table-cell">{{ employee.hire_date | date:'mediumDate' }}</td>
                <td class="table-cell">
                  <div class="flex items-center space-x-2">
                    <a 
                      [routerLink]="[employee._id]"
                      class="btn btn-sm btn-outline text-slate-600 dark:text-slate-300"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      <span class="sr-only">View</span>
                    </a>
                    
                    <a 
                      *appHasPermission="'employees:write'"
                      [routerLink]="[employee._id, 'edit']"
                      class="btn btn-sm btn-outline text-blue-600 dark:text-blue-400"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      <span class="sr-only">Edit</span>
                    </a>
                    
                    <button 
                      *appHasPermission="'employees:delete'"
                      (click)="onDeleteEmployee(employee)"
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
        <div *ngIf="!loading && employees && employees.length > 0" class="px-6 py-4 flex items-center justify-between border-t border-[var(--border-color)]">
          <div>
            <p class="text-sm text-[var(--text-secondary)]">
              Showing <span class="font-medium">{{ (currentPage - 1) * pageSize + 1 }}</span> to 
              <span class="font-medium">{{ Math.min(currentPage * pageSize, totalEmployees) }}</span> of 
              <span class="font-medium">{{ totalEmployees }}</span> results
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
              [disabled]="currentPage >= Math.ceil(totalEmployees / pageSize)"
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
export class EmployeeListComponent implements OnInit {
  employees: Employee[] = [];
  stores: Store[] = [];
  loading = true;
  error = '';
  
  // Pagination
  currentPage = 1;
  pageSize = 10;
  totalEmployees = 0;
  
  // Search and Filters
  searchQuery = '';
  selectedStoreId = '';
  selectedStatus = '';
  searchTimeout: any;
  
  // For template use
  Math = Math;
  
  constructor(
    private employeeService: EmployeeService,
    private storeService: StoreService,
    private permissionService: PermissionService
  ) {}
  
  ngOnInit(): void {
    this.loadStores();
    this.loadEmployees();
  }
  
  loadStores(): void {
    this.storeService.getStores({ is_active: true }).subscribe({
      next: (stores) => {
        this.stores = stores;
      },
      error: (err) => {
        console.error('Error loading stores:', err);
      }
    });
  }
  
  loadEmployees(): void {
    this.loading = true;
    this.error = '';
    
    // For all scenarios, fetch all employees first
    this.employeeService.getEmployees({}).subscribe({
      next: (allEmployees) => {
        console.log(`Received ${allEmployees.length} total employees from API`);
        
        // Check if we need to use client-side filtering (search or combination of filters)
        if (this.searchQuery && this.searchQuery.trim() !== '') {
          // Always use client-side for search
          this.applyClientSideFiltering(allEmployees);
        } else if (this.selectedStatus || this.selectedStoreId) {
          // For status and store filters, try server-side first
          const skip = (this.currentPage - 1) * this.pageSize;
          const options: any = {
            skip: skip,
            limit: this.pageSize
          };
          
          if (this.selectedStoreId) {
            options.store_id = this.selectedStoreId;
          }
          
          if (this.selectedStatus) {
            options.status = this.selectedStatus;
          }
          
          console.log('Employee filter options being sent to API:', options);
          
          this.employeeService.getEmployees(options).subscribe({
            next: (filteredEmployees) => {
              console.log(`Received ${filteredEmployees.length} filtered employees from API`);
              
              // If we suspect server-side filtering isn't working properly, apply client-side
              if ((this.selectedStatus || this.selectedStoreId) && 
                  filteredEmployees.length === allEmployees.length) {
                console.log('Server-side filtering may not be working correctly, falling back to client-side');
                this.applyClientSideFiltering(allEmployees);
              } else {
                // Use server-filtered results
                this.employees = filteredEmployees;
                
                // Get total count for pagination
                // Count total matching server-side criteria
                const totalOptions = { ...options };
                delete totalOptions.skip;
                delete totalOptions.limit;
                
                // Estimate total
                this.totalEmployees = filteredEmployees.length > 0 ? 
                  skip + filteredEmployees.length + (filteredEmployees.length === this.pageSize ? 1 : 0) : 0;
                
                this.loading = false;
              }
            },
            error: (err) => {
              console.error('Error with server-side filtering:', err);
              // Fall back to client-side on error
              this.applyClientSideFiltering(allEmployees);
            }
          });
        } else {
          // No filters, just paginate all employees
          const start = (this.currentPage - 1) * this.pageSize;
          this.employees = allEmployees.slice(start, start + this.pageSize);
          this.totalEmployees = allEmployees.length;
          this.loading = false;
        }
      },
      error: (err) => {
        this.error = 'Failed to load employees. Please try again later.';
        this.loading = false;
        console.error('Error loading employees:', err);
      }
    });
  }
  
  private applyClientSideFiltering(allEmployees: Employee[]): void {
    console.log('Applying client-side filtering');
    
    // Start with all employees
    let result = [...allEmployees];
    
    // Debug what status values are in the dataset
    const uniqueStatuses = [...new Set(result.map(emp => emp.employment_status))];
    console.log('Unique employment_status values in data:', uniqueStatuses);
    
    // Apply store filter if selected
    if (this.selectedStoreId) {
      console.log('Filtering by store ID:', this.selectedStoreId);
      result = result.filter(emp => emp.store_id === this.selectedStoreId);
      console.log(`After store_id filter: ${result.length} employees`);
    }
    
    // Apply status filter if selected
    if (this.selectedStatus) {
      console.log('Filtering by status:', this.selectedStatus);
      const beforeCount = result.length;
      result = result.filter(emp => emp.employment_status === this.selectedStatus);
      console.log(`After status filter: ${result.length} employees (filtered out ${beforeCount - result.length})`);
    }
    
    // Apply search filter across multiple fields
    if (this.searchQuery && this.searchQuery.trim() !== '') {
      const query = this.searchQuery.toLowerCase();
      console.log('Searching for:', query);
      const beforeCount = result.length;
      
      result = result.filter(emp => 
        (emp.full_name && emp.full_name.toLowerCase().includes(query)) ||
        (emp.position && emp.position.toLowerCase().includes(query)) ||
        (emp.email && emp.email.toLowerCase().includes(query))
      );
      
      console.log(`After search filter: ${result.length} employees (filtered out ${beforeCount - result.length})`);
    }
    
    // Apply pagination to the filtered results
    const start = (this.currentPage - 1) * this.pageSize;
    const paginatedResult = result.slice(start, start + this.pageSize);
    
    this.employees = paginatedResult;
    this.totalEmployees = result.length;
    this.loading = false;
  }
  
  onSearch(): void {
    // Debounce search to avoid too many API calls
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
    
    this.searchTimeout = setTimeout(() => {
      this.currentPage = 1; // Reset to first page when searching
      this.loadEmployees();
    }, 300);
  }
  
  onFilterChange(): void {
    this.currentPage = 1;
    console.log("Filter changed - Store:", this.selectedStoreId, "Status:", this.selectedStatus);
    this.loadEmployees();
  }
  
  getEmployeeInitials(employee: Employee): string {
    if (!employee.full_name) return 'E';
    
    const names = employee.full_name.split(' ');
    if (names.length === 1) return names[0].charAt(0).toUpperCase();
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
  }
  
  getStatusLabel(status: string): string {
    switch (status) {
      case 'active': return 'Active';
      case 'on_leave': return 'On Leave';
      case 'terminated': return 'Terminated';
      default: return status;
    }
  }
  
  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'on_leave':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'terminated':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  }
  
  goToPage(page: number): void {
    if (page < 1 || page > Math.ceil(this.totalEmployees / this.pageSize)) {
      return;
    }
    
    this.currentPage = page;
    this.loadEmployees();
  }
  
  getPageNumbers(): number[] {
    const totalPages = Math.ceil(this.totalEmployees / this.pageSize);
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
  
  onDeleteEmployee(employee: Employee): void {
    if (!confirm(`Are you sure you want to delete ${employee.full_name || 'this employee'}?`)) {
      return;
    }
    
    this.employeeService.deleteEmployee(employee._id).subscribe({
      next: (success) => {
        if (success) {
          this.employees = this.employees.filter(e => e._id !== employee._id);
          // Reload if the last item on the page was deleted
          if (this.employees.length === 0 && this.currentPage > 1) {
            this.currentPage--;
            this.loadEmployees();
          }
        } else {
          this.error = 'Failed to delete employee.';
        }
      },
      error: (err) => {
        this.error = 'Failed to delete employee. Please try again later.';
        console.error('Error deleting employee:', err);
      }
    });
  }
}