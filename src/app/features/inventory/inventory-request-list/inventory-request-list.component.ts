// src/app/features/inventory/inventory-request-list/inventory-request-list.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { InventoryService } from '../../../core/services/inventory.service';
import { StoreService } from '../../../core/services/store.service';
import { AuthService } from '../../../core/auth/auth.service';
import { PermissionService } from '../../../core/auth/permission.service';
import { InventoryRequest } from '../../../shared/models/inventory-request.model';
import { Store } from '../../../shared/models/store.model';
import { DateTimeUtils } from '../../../core/utils/date-time-utils.service';
import { HasPermissionDirective } from '../../../shared/directives/has-permission.directive';
import { EmployeeService } from '../../../core/services/employee.service';

@Component({
  selector: 'app-inventory-request-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, HasPermissionDirective],
  templateUrl: './inventory-request-list.component.html',
  styleUrls: ['./inventory-request-list.component.scss']
})
export class InventoryRequestListComponent implements OnInit {
  inventoryRequests: InventoryRequest[] = [];
  stores: Store[] = [];
  loading = true;
  error = '';
  
  // Filters
  statusFilter = '';
  storeFilter = '';
  
  // Pagination
  currentPage = 1;
  pageSize = 10;
  totalRequests = 0;
  Array = Array;
  
  constructor(
    private inventoryService: InventoryService,
    private storeService: StoreService,
    private authService: AuthService,
    public permissionService: PermissionService,
    private employeeService: EmployeeService
  ) {}
  
  ngOnInit(): void {
    this.loadStores();
    this.loadInventoryRequests();
  }
  
  loadStores(): void {
    // Only load stores if user has permission
    if (this.permissionService.hasPermission('stores:read')) {
      this.storeService.getStores().subscribe({
        next: (stores) => {
          this.stores = stores;
        },
        error: (err) => {
          console.error('Error loading stores:', err);
        }
      });
    }
  }
  
  loadInventoryRequests(): void {
    this.loading = true;
    this.error = '';
    
    const options: any = {
      skip: (this.currentPage - 1) * this.pageSize,
      limit: this.pageSize
    };
    
    if (this.statusFilter) {
      options.status = this.statusFilter;
    }
    
    if (this.storeFilter) {
      options.store_id = this.storeFilter;
    }
    
    // Define a common handler for processing requests
    const processRequests = (requests: InventoryRequest[]) => {
      console.log('Received inventory requests:', requests);
      
      // Store the requests as-is - no need to process the items array since
      // we're using item_count from the summary response
      this.inventoryRequests = requests;
      
      this.calculatePagination(requests);
      this.loading = false;
    };
    
    // If admin, load all requests
    if (this.permissionService.isAdmin()) {
      this.inventoryService.getInventoryRequests(options).subscribe({
        next: processRequests,
        error: (err) => {
          console.error('Error loading inventory requests:', err);
          this.error = 'Failed to load inventory requests. Please try again later.';
          this.loading = false;
        }
      });
    } 
    // If manager, load store-specific requests
    else if (this.permissionService.isManager()) {
      // Get employee information to filter by managed stores
      this.employeeService.getEmployeeByUserId(this.authService.currentUser?._id || '').subscribe({
        next: (employee) => {
          if (employee && employee.store_id) {
            // If manager has assigned store, filter by that store
            options.store_id = employee.store_id;
          }
          
          this.inventoryService.getInventoryRequests(options).subscribe({
            next: processRequests,
            error: (err) => {
              console.error('Error loading inventory requests:', err);
              this.error = 'Failed to load inventory requests. Please try again later.';
              this.loading = false;
            }
          });
        },
        error: (err) => {
          // Fallback to unfiltered requests if employee lookup fails
          console.error('Error getting employee info:', err);
          this.inventoryService.getInventoryRequests(options).subscribe({
            next: processRequests,
            error: (err) => {
              console.error('Error loading inventory requests:', err);
              this.error = 'Failed to load inventory requests. Please try again later.';
              this.loading = false;
            }
          });
        }
      });
    } 
    // If employee, load only their own requests
    else {
      this.inventoryService.getMyInventoryRequests({
        skip: (this.currentPage - 1) * this.pageSize,
        limit: this.pageSize,
        status: this.statusFilter
      }).subscribe({
        next: processRequests,
        error: (err) => {
          console.error('Error loading my inventory requests:', err);
          this.error = 'Failed to load your inventory requests. Please try again later.';
          this.loading = false;
        }
      });
    }
  }
  
  // Helper method to calculate pagination info
  calculatePagination(requests: InventoryRequest[]): void {
    if (requests.length === this.pageSize) {
      // If we got a full page, there are probably more
      this.totalRequests = (this.currentPage * this.pageSize) + 1;
    } else if (requests.length > 0) {
      // If we got a partial page, this is the last page
      this.totalRequests = ((this.currentPage - 1) * this.pageSize) + requests.length;
    } else if (this.currentPage > 1) {
      // If we got no results but we're past page 1, we've gone too far
      this.totalRequests = (this.currentPage - 1) * this.pageSize;
      this.currentPage--;
      this.loadInventoryRequests(); // Reload with the correct page
      return;
    } else {
      // If we're on page 1 with no results, there are no results
      this.totalRequests = 0;
    }
  }
  
  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadInventoryRequests();
    }
  }
  
  nextPage(): void {
    if (this.inventoryRequests.length === this.pageSize) {
      this.currentPage++;
      this.loadInventoryRequests();
    }
  }
  
  onStatusFilterChange(): void {
    this.currentPage = 1; // Reset to first page
    this.loadInventoryRequests();
  }
  
  onStoreFilterChange(): void {
    this.currentPage = 1; // Reset to first page
    this.loadInventoryRequests();
  }
  
  fulfillRequest(requestId: string): void {
    if (!requestId) return;
    
    if (!confirm('Are you sure you want to mark this request as fulfilled?')) {
      return;
    }
    
    this.inventoryService.fulfillInventoryRequest(requestId).subscribe({
      next: () => {
        // Reload the requests to show the updated status
        this.loadInventoryRequests();
      },
      error: (err) => {
        console.error('Error fulfilling inventory request:', err);
        this.error = 'Failed to fulfill the inventory request. Please try again later.';
      }
    });
  }
  
  cancelRequest(requestId: string): void {
    if (!requestId) return;
    
    const reason = prompt('Please provide a reason for cancellation:');
    if (!reason) {
      return; // User cancelled the prompt
    }
    
    this.inventoryService.cancelInventoryRequest(requestId, reason).subscribe({
      next: () => {
        // Reload the requests to show the updated status
        this.loadInventoryRequests();
      },
      error: (err) => {
        console.error('Error cancelling inventory request:', err);
        this.error = 'Failed to cancel the inventory request. Please try again later.';
      }
    });
  }
  
  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    return DateTimeUtils.formatDateForDisplay(dateStr);
  }
  
  getStoreName(storeId: string): string {
    if (!storeId) return 'Unknown Store';
    const store = this.stores.find(s => s._id === storeId);
    return store ? store.name : 'Unknown Store';
  }
  
  // Check permissions
  get canApproveRequests(): boolean {
    return this.permissionService.hasPermission('stock-requests:approve');
  }
  
  get canCreateRequests(): boolean {
    return this.permissionService.hasPermission('stock-requests:write');
  }
  
  // Get status badge class based on status
  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'fulfilled':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  }

  // Helper method for safely accessing items length
  getItemsCount(request: InventoryRequest | undefined): number {
    // First check if item_count is available (from the API)
    if (request?.item_count !== undefined) {
      return request.item_count;
    }
    
    // Fall back to counting items if available
    if (!request || !request.items) {
      return 0;
    }
    return Array.isArray(request.items) ? request.items.length : 0;
  }
  
  getItemsSlice(request: InventoryRequest | undefined, start: number, end: number): any[] {
    if (!request || !request.items) {
      return [];
    }
    return Array.isArray(request.items) ? request.items.slice(start, end) : [];
  }
  
  // Helper method to check if there are more than the specified number of items
  hasMoreItems(request: InventoryRequest | undefined, count: number): boolean {
    if (request?.item_count !== undefined) {
      return request.item_count > count;
    }
    
    if (!request || !request.items) {
      return false;
    }
    return Array.isArray(request.items) && request.items.length > count;
  }
  
  // Helper method to get the number of additional items
  getAdditionalItemsCount(request: InventoryRequest | undefined, count: number): number {
    if (request?.item_count !== undefined) {
      return Math.max(0, request.item_count - count);
    }
    
    if (!request || !request.items) {
      return 0;
    }
    return Array.isArray(request.items) ? Math.max(0, request.items.length - count) : 0;
  }
  // Helper method for pagination
  isNextPageDisabled(): boolean {
    return !this.inventoryRequests || this.inventoryRequests.length < this.pageSize;
  }
  
  // Track by function for ngFor
  trackByRequestId(index: number, item: InventoryRequest): string {
    return item._id;
  }

  
}