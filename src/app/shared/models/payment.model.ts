// src/app/shared/models/payment.model.ts
export interface Payment {
  _id: string;
  employee_id: string;
  employee_name?: string;
  timesheet_ids: string[];
  period_start_date: string;
  period_end_date: string;
  total_hours: number;
  hourly_rate: number;
  gross_amount: number;
  status: PaymentStatus;
  payment_date?: string;
  confirmation_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  
  // Additional properties for UI
  store_id?: string;
  store_name?: string;
}

export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  CONFIRMED = 'confirmed',
  DISPUTED = 'disputed',
  CANCELLED = 'cancelled'
}

export interface PaymentSummary {
  _id: string;
  employee_id: string;
  employee_name?: string;
  period_start_date: string;
  period_end_date: string;
  total_hours: number;
  gross_amount: number;
  status: PaymentStatus;
  payment_date?: string;
  
  // Additional properties for UI
  store_id?: string;
  store_name?: string;
}

export interface PaymentGenerationRequest {
  start_date: string;
  end_date: string;
}

export interface PaymentStatusUpdate {
  status: PaymentStatus;
  notes?: string;
}

export interface PaymentConfirmation {
  notes?: string;
}

export interface PaymentDispute {
  reason: string;
  details?: string;
}

export class PaymentUtils {
  /**
   * Ensures a payment object has all required fields, filling in defaults where necessary
   */
  static ensureComplete(payment: Partial<Payment>): Payment {
    if (!payment) {
      throw new Error('Cannot complete a null payment');
    }
    
    return {
      _id: payment._id || '',
      employee_id: payment.employee_id || '',
      employee_name: payment.employee_name || '',
      timesheet_ids: payment.timesheet_ids || [],
      period_start_date: payment.period_start_date || '',
      period_end_date: payment.period_end_date || '',
      total_hours: payment.total_hours || 0,
      hourly_rate: payment.hourly_rate || 0,
      gross_amount: payment.gross_amount || 0,
      status: payment.status || PaymentStatus.PENDING,
      payment_date: payment.payment_date || '',
      confirmation_date: payment.confirmation_date || '',
      notes: payment.notes || '',
      created_at: payment.created_at || new Date().toISOString(),
      updated_at: payment.updated_at || new Date().toISOString(),
      store_id: payment.store_id || '',
      store_name: payment.store_name || ''
    };
  }
  
  /**
   * Format status for display with proper capitalization
   */
  static formatStatus(status: PaymentStatus | string): string {
    if (!status) return '';
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  }
}