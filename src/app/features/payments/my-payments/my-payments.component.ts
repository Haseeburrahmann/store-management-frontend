// src/app/features/payments/my-payments/my-payments.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PaymentService } from '../../../core/services/payment.service';
import { AuthService } from '../../../core/auth/auth.service';
import { PaymentSummary, PaymentStatus } from '../../../shared/models/payment.model';
import { DateTimeUtils } from '../../../core/utils/date-time-utils.service';

@Component({
  selector: 'app-my-payments',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './my-payments.component.html'
})
export class MyPaymentsComponent implements OnInit {
  payments: PaymentSummary[] = [];
  loading = true;
  error = '';
  
  // Filters
  statusFilter = '';
  dateRangeFilter = 'past-month';
  startDate = '';
  endDate = '';
  
  // Pagination
  currentPage = 1;
  pageSize = 10;
  totalPayments = 0;
  
  // Helper for template
  PaymentStatus = PaymentStatus;
  
  constructor(
    private paymentService: PaymentService,
    private authService: AuthService
  ) {}
  
  ngOnInit(): void {
    this.applyDateRangeFilter(); // Sets default date range
    this.loadMyPayments();
  }
  
  loadMyPayments(): void {
    this.loading = true;
    this.error = '';
    
    const options: any = {
      skip: (this.currentPage - 1) * this.pageSize,
      limit: this.pageSize
    };
    
    if (this.statusFilter) {
      options.status = this.statusFilter;
    }
    
    if (this.startDate) {
      options.start_date = this.startDate;
    }
    
    if (this.endDate) {
      options.end_date = this.endDate;
    }
    
    this.paymentService.getMyPayments(options).subscribe({
      next: (payments) => {
        this.payments = payments;
        console.log(`Loaded ${payments.length} payments`);
        
        // Calculate pagination information
        this.calculatePagination(payments);
        
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading my payments:', err);
        this.error = 'Failed to load payments. Please try again later.';
        this.loading = false;
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
      this.loadMyPayments(); // Reload with the correct page
      return;
    } else {
      // If we're on page 1 with no results, there are no results
      this.totalPayments = 0;
    }
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
    this.loadMyPayments();
  }
  
  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadMyPayments();
    }
  }
  
  nextPage(): void {
    if (this.payments.length === this.pageSize) {
      this.currentPage++;
      this.loadMyPayments();
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