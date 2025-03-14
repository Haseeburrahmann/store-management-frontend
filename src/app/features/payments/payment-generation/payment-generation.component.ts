// src/app/features/payments/payment-generation/payment-generation.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { PaymentService } from '../../../core/services/payment.service';
import { StoreService } from '../../../core/services/store.service';
import { PaymentGenerationRequest } from '../../../shared/models/payment.model';
import { Store } from '../../../shared/models/store.model';
import { DateTimeUtils } from '../../../core/utils/date-time-utils.service';

@Component({
  selector: 'app-payment-generation',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  templateUrl: './payment-generation.component.html'
})
export class PaymentGenerationComponent implements OnInit {
  generationForm!: FormGroup;
  loading = false;
  success = false;
  error: string | null = null;
  selectedStore: string | null = null;
  stores: Store[] = [];
  
  constructor(
    private paymentService: PaymentService,
    private storeService: StoreService,
    private fb: FormBuilder,
    private router: Router
  ) {}
  
  ngOnInit(): void {
    // Initialize the form
    this.initForm();
    
    // Load stores for filtering
    this.loadStores();
  }
  
  private initForm(): void {
    // Create default date range for the last pay period (previous 2 weeks)
    const today = new Date();
    const endDate = new Date(today);
    endDate.setDate(today.getDate() - (today.getDay() === 0 ? 0 : today.getDay()));
    
    const startDate = new Date(endDate);
    startDate.setDate(endDate.getDate() - 13); // 2 weeks before end date
    
    this.generationForm = this.fb.group({
      start_date: [DateTimeUtils.formatDateForAPI(startDate), Validators.required],
      end_date: [DateTimeUtils.formatDateForAPI(endDate), Validators.required],
      store_id: ['']
    });
  }
  
  loadStores(): void {
    this.storeService.getStores().subscribe({
      next: (stores) => {
        this.stores = stores;
        console.log(`Loaded ${stores.length} stores`);
      },
      error: (err) => {
        console.error('Error loading stores:', err);
        this.error = 'Failed to load stores. Please try again later.';
      }
    });
  }
  
  generatePayments(): void {
    if (this.generationForm.invalid) {
      // Mark all fields as touched to trigger validation messages
      Object.keys(this.generationForm.controls).forEach(key => {
        const control = this.generationForm.get(key);
        control?.markAsTouched();
      });
      return;
    }
    
    this.loading = true;
    this.success = false;
    this.error = null;
    
    // Ensure dates are in string format YYYY-MM-DD
    const startDate = this.generationForm.get('start_date')?.value;
    const endDate = this.generationForm.get('end_date')?.value;
    
    // Create the request with properly formatted dates
    const request: PaymentGenerationRequest = {
      start_date: this.ensureDateFormat(startDate),
      end_date: this.ensureDateFormat(endDate)
    };
    
    // Add store ID if selected
    const storeId = this.generationForm.get('store_id')?.value;
    const options: any = {};
    
    if (storeId) {
      options.store_id = storeId;
    }
    
    console.log('Generating payments with options:', { ...request, ...options });
    
    this.paymentService.generatePayments(request).subscribe({
      next: (payments) => {
        console.log(`Successfully generated ${payments?.length || 0} payments`);
        this.loading = false;
        this.success = true;
        
        // Redirect to payment list after a short delay
        setTimeout(() => {
          this.router.navigate(['/payments']);
        }, 2000);
      },
      error: (error) => {
        this.loading = false;
        this.error = error.error?.detail || 'Failed to generate payments';
        
        // Add additional info to help debug
        if (error.message && error.message.includes('datetime')) {
          this.error += '. There was an issue with the date format. Please try a different date range.';
          console.error('Date format issue detected:', { startDate, endDate });
        }
        
        console.error('Error generating payments', error);
      }
    });
  }
  
  // Helper method to ensure dates are in the correct string format
  private ensureDateFormat(date: any): string {
    if (!date) return '';
    
    // If it's already a string in YYYY-MM-DD format
    if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return date;
    }
    
    try {
      // Convert to Date object if it's not already
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      
      // Format as YYYY-MM-DD
      return dateObj.toISOString().split('T')[0];
    } catch (err) {
      console.error('Error formatting date:', date);
      return '';
    }
  }
  
  // Helper method for validation errors
  hasError(controlName: string, errorName: string): boolean {
    const control = this.generationForm.get(controlName);
    return !!(control && control.touched && control.hasError(errorName));
  }
  
  // Format date for display
  formatDate(dateStr: string): string {
    return DateTimeUtils.formatDateForDisplay(dateStr);
  }
  
  // Get store name by ID
  getStoreName(storeId: string): string {
    if (!storeId) return 'All Stores';
    const store = this.stores.find(s => s._id === storeId);
    return store ? store.name : 'Unknown Store';
  }
  
  cancelGeneration(): void {
    this.router.navigate(['/payments']);
  }
}