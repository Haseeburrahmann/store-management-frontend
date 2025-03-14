// src/app/features/payments/payment-confirmation/payment-confirmation.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PaymentService } from '../../../core/services/payment.service';
import { Payment, PaymentStatus } from '../../../shared/models/payment.model';
import { DateTimeUtils } from '../../../core/utils/date-time-utils.service';

@Component({
  selector: 'app-payment-confirmation',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './payment-confirmation.component.html'
})
export class PaymentConfirmationComponent implements OnInit {
  payment: Payment | null = null;
  loading = true;
  processing = false;
  error = '';
  
  // Form inputs
  confirmationNotes = '';
  disputeReason = '';
  disputeDetails = '';
  
  // UI state
  isDisputeMode = false;
  
  constructor(
    private paymentService: PaymentService,
    private router: Router,
    private route: ActivatedRoute
  ) {}
  
  ngOnInit(): void {
    // Check if dispute mode is active from query params
    this.route.queryParams.subscribe(params => {
      this.isDisputeMode = params['dispute'] === 'true';
    });
    
    this.loadPayment();
  }
  
  loadPayment(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.error = 'No payment ID provided';
      this.loading = false;
      return;
    }
    
    this.paymentService.getPayment(id).subscribe({
      next: (payment) => {
        this.payment = payment;
        console.log(`Loaded payment ${payment._id} with status ${payment.status}`);
        
        // Check if payment is in a state that can be confirmed/disputed
        if (payment.status !== PaymentStatus.PAID) {
          this.error = 'This payment cannot be confirmed or disputed in its current state.';
        }
        
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading payment:', err);
        this.error = 'Failed to load payment details. Please try again later.';
        this.loading = false;
      }
    });
  }
  
  confirmPayment(): void {
    if (!this.payment || !this.payment._id) return;
    
    this.processing = true;
    this.error = '';
    
    this.paymentService.confirmPayment(this.payment._id, {
      notes: this.confirmationNotes
    }).subscribe({
      next: () => {
        this.processing = false;
        // Redirect to my payments with a success message
        this.router.navigate(['/payments/my-payments']);
      },
      error: (err) => {
        console.error('Error confirming payment:', err);
        this.error = 'Failed to confirm payment. Please try again later.';
        this.processing = false;
      }
    });
  }
  
  disputePayment(): void {
    if (!this.payment || !this.payment._id) return;
    
    if (!this.disputeReason) {
      this.error = 'Please provide a reason for disputing this payment.';
      return;
    }
    
    this.processing = true;
    this.error = '';
    
    this.paymentService.disputePayment(this.payment._id, {
      reason: this.disputeReason,
      details: this.disputeDetails
    }).subscribe({
      next: () => {
        this.processing = false;
        // Redirect to my payments with a success message
        this.router.navigate(['/payments/my-payments']);
      },
      error: (err) => {
        console.error('Error disputing payment:', err);
        this.error = 'Failed to dispute payment. Please try again later.';
        this.processing = false;
      }
    });
  }
  
  toggleDisputeMode(): void {
    this.isDisputeMode = !this.isDisputeMode;
  }
  
  cancel(): void {
    // Go back to payment detail
    if (this.payment && this.payment._id) {
      this.router.navigate(['/payments', this.payment._id]);
    } else {
      this.router.navigate(['/payments/my-payments']);
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
}