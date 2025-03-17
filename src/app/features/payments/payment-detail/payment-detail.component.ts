// src/app/features/payments/payment-detail/payment-detail.component.ts
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PaymentService } from '../../../core/services/payment.service';
import { AuthService } from '../../../core/auth/auth.service';
import { PermissionService } from '../../../core/auth/permission.service';
import { EmployeeService } from '../../../core/services/employee.service';
import { Payment, PaymentStatus, PaymentUtils } from '../../../shared/models/payment.model';
import { DateTimeUtils } from '../../../core/utils/date-time-utils.service';
import { WeeklyTimesheet } from '../../../shared/models/hours.model';
import { HasPermissionDirective } from '../../../shared/directives/has-permission.directive';

@Component({
  selector: 'app-payment-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './payment-detail.component.html'
})
export class PaymentDetailComponent implements OnInit {
  payment: Payment | null = null;
  loading = true;
  error = '';
  notes = '';
  
  // Property to store current user's employee ID
  currentUserEmployeeId: string | null = null;
  
  // Permission helpers
  PaymentStatus = PaymentStatus;
  
  // Related data
  timesheets: WeeklyTimesheet[] = [];
  
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private paymentService: PaymentService,
    private authService: AuthService,
    private permissionService: PermissionService,
    private employeeService: EmployeeService,
    private cdr: ChangeDetectorRef
  ) {}
  
  ngOnInit(): void {
    // Get current user's employee ID right away
    if (this.authService.currentUser) {
      this.employeeService.getEmployeeByUserId(this.authService.currentUser._id)
        .subscribe({
          next: (employee) => {
            if (employee) {
              console.log('Found employee record for current user:', employee._id);
              this.currentUserEmployeeId = employee._id;
              // Force change detection to update the UI if needed
              this.cdr.detectChanges();
            } else {
              console.log('No employee record found for current user');
            }
          },
          error: (err) => {
            console.error('Error fetching employee record for current user:', err);
          }
        });
    }
    
    this.loadPayment();
  }
  
  loadPayment(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.error = 'No payment ID provided';
      this.loading = false;
      return;
    }
    
    this.paymentService.getPayment(id, true).subscribe({
      next: (payment) => {
        this.payment = payment;
        this.notes = payment.notes || '';
        
        console.log(`Loaded payment ${payment._id} with status ${payment.status}, employee_id: ${payment.employee_id}`);
        
        // Check if we can show controls
        console.log('Payment belongs to current user:', this.isOwnPayment);
        
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading payment:', err);
        this.error = 'Failed to load payment details. Please try again later.';
        this.loading = false;
      }
    });
  }
  
  get isOwnPayment(): boolean {
    if (!this.payment || !this.authService.currentUser) return false;
    
    const currentUserId = this.authService.currentUser._id;
    
    // First check if the payment has employee_id that matches currentUser._id
    if (this.payment.employee_id === currentUserId) {
      console.log('Payment matches user ID directly');
      return true;
    }
    
    // Check if the payment employee_id matches the user's employee record
    if (this.currentUserEmployeeId && this.payment.employee_id === this.currentUserEmployeeId) {
      console.log('Payment matches employee ID');
      return true;
    }
    
    // If we don't have the employee ID yet, log for debugging
    if (!this.currentUserEmployeeId) {
      console.log('Employee ID not yet available for user', currentUserId);
    } else {
      console.log(
        'Payment employee_id', this.payment.employee_id, 
        'does not match user_id', currentUserId, 
        'or employee_id', this.currentUserEmployeeId
      );
    }
    
    return false;
  }
  
  get canManagePayments(): boolean {
    return this.permissionService.hasPermission('payments:write');
  }
  
  processPayment(): void {
    if (!this.payment || !this.payment._id) return;
    
    if (!confirm('Are you sure you want to mark this payment as paid?')) {
      return;
    }
    
    this.loading = true;
    
    this.paymentService.processPayment(this.payment._id, {
      status: PaymentStatus.PAID,
      notes: this.notes || 'Payment processed'
    }).subscribe({
      next: (updatedPayment) => {
        this.payment = updatedPayment;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error processing payment:', err);
        this.error = 'Failed to process payment. Please try again later.';
        this.loading = false;
      }
    });
  }
  
  cancelPayment(): void {
    if (!this.payment || !this.payment._id) return;
    
    if (!confirm('Are you sure you want to cancel this payment?')) {
      return;
    }
    
    this.loading = true;
    
    this.paymentService.cancelPayment(this.payment._id, {
      status: PaymentStatus.CANCELLED,
      notes: this.notes || 'Payment cancelled'
    }).subscribe({
      next: (updatedPayment) => {
        this.payment = updatedPayment;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error cancelling payment:', err);
        this.error = 'Failed to cancel payment. Please try again later.';
        this.loading = false;
      }
    });
  }
  
  confirmPayment(): void {
    if (!this.payment || !this.payment._id) return;
    
    this.router.navigate(['/payments', this.payment._id, 'confirm']);
  }
  
  disputePayment(): void {
    if (!this.payment || !this.payment._id) return;
    
    this.router.navigate(['/payments', this.payment._id, 'confirm'], { queryParams: { dispute: 'true' } });
  }
  
  updateNotes(): void {
    if (!this.payment || !this.payment._id) return;
    
    this.loading = true;
    
    // Since there's no dedicated notes endpoint, we use the appropriate status update
    // endpoint based on the current status
    let observable;
    
    switch (this.payment.status) {
      case PaymentStatus.PENDING:
        observable = this.paymentService.processPayment(this.payment._id, {
          status: PaymentStatus.PENDING,
          notes: this.notes
        });
        break;
      case PaymentStatus.PAID:
        observable = this.paymentService.processPayment(this.payment._id, {
          status: PaymentStatus.PAID,
          notes: this.notes
        });
        break;
      case PaymentStatus.CONFIRMED:
        observable = this.paymentService.confirmPayment(this.payment._id, {
          notes: this.notes
        });
        break;
      case PaymentStatus.DISPUTED:
        // For disputed, we would need the original dispute reason
        observable = this.paymentService.disputePayment(this.payment._id, {
          reason: 'Payment disputed',
          details: this.notes
        });
        break;
      case PaymentStatus.CANCELLED:
        observable = this.paymentService.cancelPayment(this.payment._id, {
          status: PaymentStatus.CANCELLED,
          notes: this.notes
        });
        break;
      default:
        this.loading = false;
        return;
    }
    
    observable.subscribe({
      next: (updatedPayment) => {
        this.payment = updatedPayment;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error updating notes:', err);
        this.error = 'Failed to update notes. Please try again later.';
        this.loading = false;
      }
    });
  }
  
  deletePayment(): void {
    if (!this.payment || !this.payment._id) return;
    
    if (!confirm('Are you sure you want to delete this payment? This action cannot be undone.')) {
      return;
    }
    
    this.loading = true;
    
    this.paymentService.deletePayment(this.payment._id).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/payments']);
      },
      error: (err) => {
        console.error('Error deleting payment:', err);
        this.error = 'Failed to delete payment. Please try again later.';
        this.loading = false;
      }
    });
  }
  
  navigateBack(): void {
    // If we know it's the user's own payment, go back to my-payments
    if (this.isOwnPayment) {
      this.router.navigate(['/payments/my-payments']);
    } else {
      // Otherwise go to the main payments list
      this.router.navigate(['/payments']);
    }
  }
  
  // Helper methods for the template
  formatDate(dateStr?: string): string {
    if (!dateStr) return '';
    return DateTimeUtils.formatDateForDisplay(dateStr);
  }
  
  formatDateTime(dateStr?: string): string {
    if (!dateStr) return '';
    return DateTimeUtils.formatDateForDisplay(dateStr, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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