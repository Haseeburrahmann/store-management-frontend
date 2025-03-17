// src/app/features/payments/payment-list/payment-list.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PaymentService } from '../../../core/services/payment.service';
import { StoreService } from '../../../core/services/store.service';
import { EmployeeService } from '../../../core/services/employee.service';
import { PaymentSummary, PaymentStatus, PaymentUtils } from '../../../shared/models/payment.model';
import { Store } from '../../../shared/models/store.model';
import { Employee } from '../../../shared/models/employee.model';
import { DateTimeUtils } from '../../../core/utils/date-time-utils.service';
import { HasPermissionDirective } from '../../../shared/directives/has-permission.directive';
import { PermissionService } from '../../../core/auth/permission.service';
import { forkJoin } from 'rxjs';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-payment-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, HasPermissionDirective],
  templateUrl: './payment-list.component.html'
})
export class PaymentListComponent implements OnInit {
  // UI state
  loading = true;
  error = '';
  
  // Data
  payments: PaymentSummary[] = [];
  stores: Store[] = [];
  employees: Employee[] = [];
  
  // Filters
  employeeFilter = '';
  storeFilter = '';
  statusFilter = '';
  dateRangeFilter = 'past-month';
  startDate = '';
  endDate = '';
  
  // Pagination
  currentPage = 1;
  pageSize = 10;
  totalPayments = 0;
  
  // Permission helper
  PaymentStatus = PaymentStatus;
  
  constructor(
    private paymentService: PaymentService,
    private storeService: StoreService,
    private employeeService: EmployeeService,
    private permissionService: PermissionService,
    private router: Router,
    private authService : AuthService
  ) {}
  
  ngOnInit(): void {

    if (this.permissionService.isEmployee() && !this.permissionService.hasPermission('payments:write')) {
      console.log('Employee detected, redirecting to My Payments');
      this.router.navigate(['/payments/my-payments']);
      return;
    }
    this.loadInitialData();
  }
  
  loadInitialData(): void {
    // Load both stores and employees first, then load payments
    // This ensures we have the store data for proper display
    forkJoin({
      stores: this.storeService.getStores(),
      employees: this.employeeService.getEmployees()
    }).subscribe({
      next: (results) => {
        this.stores = results.stores;
        this.employees = results.employees;
        console.log(`Loaded ${this.stores.length} stores and ${this.employees.length} employees`);
        
        // Now load payments with the store and employee data available
        this.applyDateRangeFilter();
      },
      error: (err) => {
        console.error('Error loading initial data:', err);
        this.error = 'Failed to load store and employee data. Please try again later.';
        this.loading = false;
      }
    });
  }
  
  get canWritePayments(): boolean {
    return this.permissionService.hasPermission('payments:write');
  }
  
  loadPayments(): void {
    this.loading = true;
    this.error = '';
    
    const options: any = {
      skip: (this.currentPage - 1) * this.pageSize,
      limit: this.pageSize
    };
    
    // Apply filters from UI
    if (this.employeeFilter) {
      options.employee_id = this.employeeFilter;
      console.log('Employee filter applied:', this.employeeFilter);
    }
    
    if (this.storeFilter) {
      options.store_id = this.storeFilter;
      console.log('Store filter applied:', this.storeFilter);
    }
    
    if (this.statusFilter) {
      options.status = this.statusFilter;
    }
    
    if (this.startDate) {
      options.start_date = this.startDate;
    }
    
    if (this.endDate) {
      options.end_date = this.endDate;
    }
    
    // If manager, only show payments for their store
    if (this.permissionService.isManager() && !this.permissionService.isAdmin()) {
      const user = this.authService.currentUser;
      if (user) {
        // Find employee record for this manager to get store ID
        this.employeeService.getEmployeeByUserId(user._id).subscribe({
          next: (employee) => {
            if (employee && employee.store_id) {
              // Override store filter with manager's store
              this.storeFilter = employee.store_id;
              options.store_id = employee.store_id;
              this.getPaymentsWithOptions(options);
            } else {
              this.loading = false;
              this.error = 'Could not determine your store assignment.';
            }
          },
          error: (err) => {
            console.error('Error getting employee record:', err);
            this.loading = false;
            this.error = 'Failed to determine your store assignment.';
          }
        });
        return; // Early return since we're handling this in the subscription
      }
    }
    
    // For admin or if manager store resolution failed, proceed with regular options
    console.log('Final raw options:', options);
    this.getPaymentsWithOptions(options);
  }
  
  getPaymentsWithOptions(options: any): void {
    this.paymentService.getPayments(options).subscribe({
      next: (payments) => {
        this.payments = payments;
        console.log(`Loaded ${payments.length} payments`);
        
        // Manually enhance payments with store and employee info if missing
        this.enhancePayments(payments);
        
        // Calculate pagination information
        this.calculatePagination(payments);
        
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading payments:', err);
        this.error = 'Failed to load payments. Please try again later.';
        this.loading = false;
      }
    });
  }

  /**
   * Manually enhance payments with store and employee info
   * This ensures we always have store names displayed
   */
  enhancePayments(payments: PaymentSummary[]): void {
    payments.forEach(payment => {
      // Add employee name if missing
      if (!payment.employee_name && payment.employee_id) {
        const employee = this.employees.find(e => e._id === payment.employee_id);
        if (employee) {
          payment.employee_name = employee.full_name;
          
          // Also set store info if not already set and employee has store
          if (!payment.store_id && employee.store_id) {
            payment.store_id = employee.store_id;
            
            const store = this.stores.find(s => s._id === employee.store_id);
            if (store) {
              payment.store_name = store.name;
            }
          }
        }
      }
      
      // Add store name if missing but we have store_id
      if (!payment.store_name && payment.store_id) {
        const store = this.stores.find(s => s._id === payment.store_id);
        if (store) {
          payment.store_name = store.name;
        } else {
          payment.store_name = 'Unknown'; // Fallback if store not found
        }
      }
    });
  }
  
  // Helper method to calculate pagination info
  calculatePagination(payments: PaymentSummary[]): void {
    if (payments.length === this.pageSize) {
      // If we got a full page, there are probably more
      this.totalPayments = (this.currentPage * this.pageSize) + 1;
    } else if (payments.length > 0) {
      // If we got a partial page, this is the last page
      this.totalPayments = ((this.currentPage - 1) * this.pageSize) + payments.length;
    } else if (this.currentPage > 1) {
      // If we got no results but we're past page 1, we've gone too far
      this.totalPayments = (this.currentPage - 1) * this.pageSize;
      this.currentPage--;
      this.loadPayments(); // Reload with the correct page
      return;
    } else {
      // If we're on page 1 with no results, there are no results
      this.totalPayments = 0;
    }
  }
  
  onStoreFilterChange(event: any): void {
    console.log('Store filter changed to:', this.storeFilter, 'Event:', event);
    this.loadPayments();
  }
  
  applyDateRangeFilter(): void {
    const today = new Date();
    const endDate = new Date(today);
    let startDate: Date;
    
    switch (this.dateRangeFilter) {
      case 'past-month':
        startDate = new Date(today);
        startDate.setMonth(today.getMonth() - 1);
        break;
      case 'past-3-months':
        startDate = new Date(today);
        startDate.setMonth(today.getMonth() - 3);
        break;
      case 'past-6-months':
        startDate = new Date(today);
        startDate.setMonth(today.getMonth() - 6);
        break;
      case 'past-year':
        startDate = new Date(today);
        startDate.setFullYear(today.getFullYear() - 1);
        break;
      case 'custom':
        // Don't change anything, use the values from the inputs
        return;
      default:
        startDate = new Date(today);
        startDate.setMonth(today.getMonth() - 1);
    }
    
    this.startDate = DateTimeUtils.formatDateForAPI(startDate);
    this.endDate = DateTimeUtils.formatDateForAPI(endDate);
    
    // Reset to first page when filter changes
    this.currentPage = 1;
    this.loadPayments();
  }
  
  processPayment(paymentId: string): void {
    if (!confirm('Are you sure you want to mark this payment as paid?')) {
      return;
    }
    
    this.paymentService.processPayment(paymentId, {
      status: PaymentStatus.PAID,
      notes: 'Payment processed by admin'
    }).subscribe({
      next: (payment) => {
        // Find and update the payment in the list
        const index = this.payments.findIndex(p => p._id === paymentId);
        if (index !== -1) {
          this.payments[index] = payment;
        }
      },
      error: (err) => {
        console.error('Error processing payment:', err);
        this.error = 'Failed to process payment. Please try again later.';
      }
    });
  }
  
  cancelPayment(paymentId: string): void {
    if (!confirm('Are you sure you want to cancel this payment?')) {
      return;
    }
    
    this.paymentService.cancelPayment(paymentId, {
      status: PaymentStatus.CANCELLED,
      notes: 'Payment cancelled by admin'
    }).subscribe({
      next: (payment) => {
        // Find and update the payment in the list
        const index = this.payments.findIndex(p => p._id === paymentId);
        if (index !== -1) {
          this.payments[index] = payment;
        }
      },
      error: (err) => {
        console.error('Error cancelling payment:', err);
        this.error = 'Failed to cancel payment. Please try again later.';
      }
    });
  }
  
  deletePayment(paymentId: string): void {
    if (!confirm('Are you sure you want to delete this payment? This action cannot be undone.')) {
      return;
    }
    
    this.paymentService.deletePayment(paymentId).subscribe({
      next: () => {
        // Remove the payment from the list
        this.payments = this.payments.filter(p => p._id !== paymentId);
        
        // Update total count
        this.totalPayments--;
      },
      error: (err) => {
        console.error('Error deleting payment:', err);
        this.error = 'Failed to delete payment. Please try again later.';
      }
    });
  }
  
  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadPayments();
    }
  }
  
  nextPage(): void {
    if (this.payments.length === this.pageSize) {
      this.currentPage++;
      this.loadPayments();
    }
  }
  
  trackByPaymentId(index: number, payment: PaymentSummary): string {
    return payment._id || `payment-${index}`;
  }
  
  formatDate(dateStr: string): string {
    return DateTimeUtils.formatDateForDisplay(dateStr);
  }
  
  formatCurrency(amount: number): string {
    return amount.toFixed(2);
  }
  
  // Format the ID for display - use first 8 characters for consistency
  formatId(id: string): string {
    if (!id) return '';
    return id.substring(0, 8);
  }
  
  getStatusClass(status: string): string {
    switch(status) {
      case PaymentStatus.PENDING:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case PaymentStatus.PAID:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case PaymentStatus.CONFIRMED:
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case PaymentStatus.DISPUTED:
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case PaymentStatus.CANCELLED:
        return 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300';
      default:
        return 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300';
    }
  }
}