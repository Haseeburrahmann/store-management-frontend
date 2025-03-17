// src/app/features/inventory/inventory-request-detail/inventory-request-detail.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { InventoryService } from '../../../core/services/inventory.service';
import { AuthService } from '../../../core/auth/auth.service';
import { PermissionService } from '../../../core/auth/permission.service';
import { InventoryRequest } from '../../../shared/models/inventory-request.model';
import { DateTimeUtils } from '../../../core/utils/date-time-utils.service';
import { HasPermissionDirective } from '../../../shared/directives/has-permission.directive';

@Component({
  selector: 'app-inventory-request-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, HasPermissionDirective],
  templateUrl: './inventory-request-detail.component.html',
  styleUrls: ['./inventory-request-detail.component.scss']
})
export class InventoryRequestDetailComponent implements OnInit {
  inventoryRequest: InventoryRequest | null = null;
  loading = true;
  error = '';
  fulfillmentNotes = '';
  
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private inventoryService: InventoryService,
    private authService: AuthService,
    private permissionService: PermissionService
  ) {}
  
  ngOnInit(): void {
    this.loadInventoryRequest();
  }
  
  loadInventoryRequest(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.error = 'Invalid request ID';
      this.loading = false;
      return;
    }
    
    this.inventoryService.getInventoryRequestById(id).subscribe({
      next: (request) => {
        this.inventoryRequest = request;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading inventory request:', err);
        this.error = 'Failed to load the inventory request details. Please try again later.';
        this.loading = false;
      }
    });
  }
  
  fulfillRequest(): void {
    if (!this.inventoryRequest || !this.inventoryRequest._id) {
      return;
    }
    
    if (!confirm('Are you sure you want to mark this request as fulfilled?')) {
      return;
    }
    
    this.loading = true;
    
    this.inventoryService.fulfillInventoryRequest(this.inventoryRequest._id, this.fulfillmentNotes).subscribe({
      next: (updatedRequest) => {
        this.inventoryRequest = updatedRequest;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error fulfilling inventory request:', err);
        this.error = 'Failed to fulfill the inventory request. Please try again later.';
        this.loading = false;
      }
    });
  }
  
  cancelRequest(): void {
    if (!this.inventoryRequest || !this.inventoryRequest._id) {
      return;
    }
    
    const reason = prompt('Please provide a reason for cancellation:');
    if (!reason) {
      return; // User cancelled the prompt
    }
    
    this.loading = true;
    
    this.inventoryService.cancelInventoryRequest(this.inventoryRequest._id, reason).subscribe({
      next: (updatedRequest) => {
        this.inventoryRequest = updatedRequest;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error cancelling inventory request:', err);
        this.error = 'Failed to cancel the inventory request. Please try again later.';
        this.loading = false;
      }
    });
  }
  
  printRequest(): void {
    window.print();
  }
  
  goBack(): void {
    this.router.navigate(['/inventory']);
  }
  
  formatDate(dateStr: string): string {
    return DateTimeUtils.formatDateForDisplay(dateStr);
  }
  
  // Check permissions
  get canApproveRequests(): boolean {
    return this.permissionService.hasPermission('stock-requests:approve');
  }
  
  get isOwnRequest(): boolean {
    if (!this.inventoryRequest || !this.authService.currentUser) {
      return false;
    }
    return this.inventoryRequest.employee_id === this.authService.currentUser._id;
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
}