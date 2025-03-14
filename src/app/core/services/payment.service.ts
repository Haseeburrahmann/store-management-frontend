// src/app/core/services/payment.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, forkJoin, throwError } from 'rxjs';
import { catchError, tap, map, switchMap } from 'rxjs/operators';
import { 
  Payment, 
  PaymentSummary, 
  PaymentGenerationRequest, 
  PaymentStatusUpdate,
  PaymentConfirmation,
  PaymentDispute,
  PaymentUtils
} from '../../shared/models/payment.model';
import { ErrorHandlingService } from '../utils/error-handling.service';
import { StoreService } from './store.service';
import { EmployeeService } from './employee.service';
import { IdUtils } from '../utils/id-utils.service';

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private apiUrl = '/api/v1/payments';
  
  constructor(
    private http: HttpClient,
    private storeService: StoreService,
    private employeeService: EmployeeService
  ) {}
  
  /**
   * Get all payments with optional filtering
   * Enhanced to pre-load store data
   */
  getPayments(options: {
    skip?: number,
    limit?: number,
    employee_id?: string,
    store_id?: string,
    status?: string,
    start_date?: string,
    end_date?: string
  } = {}): Observable<PaymentSummary[]> {
    debugger;
    // First load all stores
    return this.storeService.getStores().pipe(
      switchMap(stores => {
        // Store the stores for later use
        const storeMap = new Map();
        stores.forEach(store => {
          storeMap.set(store._id, store);
        });
        
        // Create safe params for API request
        const safeParams = IdUtils.createIdParams(options);
        let params = new HttpParams();
        
        Object.keys(safeParams).forEach(key => {
          params = params.set(key, safeParams[key]);
        });
        
        // Log params for debugging
        const paramObj: {[key: string]: string} = {};
        params.keys().forEach(key => {
          paramObj[key] = params.get(key) || '';
        });
        console.log('Fetching payments with params:', paramObj);
        
        // Now get the payments
        return this.http.get<PaymentSummary[]>(this.apiUrl, { params }).pipe(
          map(payments => payments || []),
          tap(payments => console.log(`Fetched ${payments.length} payments`)),
          map(payments => {
            // Enhance each payment with store info if it's available
            return payments.map(payment => {
              const enhanced = { ...payment };
              
              if (payment.store_id && storeMap.has(payment.store_id)) {
                enhanced.store_name = storeMap.get(payment.store_id).name;
              }
              
              return enhanced;
            });
          }),
          catchError(error => {
            console.error(`Error fetching payments: ${error.message}`);
            return of([]);
          })
        );
      }),
      catchError(error => {
        console.error(`Error loading stores for payments: ${error.message}`);
        return throwError(() => new Error('Failed to load stores for payment data'));
      })
    );
  }
  
  /**
   * Get current user's payments
   */
  getMyPayments(options: {
    skip?: number,
    limit?: number,
    status?: string,
    start_date?: string,
    end_date?: string
  } = {}): Observable<PaymentSummary[]> {
    let params = new HttpParams();
    
    if (options.skip !== undefined) params = params.set('skip', options.skip.toString());
    if (options.limit !== undefined) params = params.set('limit', options.limit.toString());
    if (options.status) params = params.set('status', options.status);
    if (options.start_date) params = params.set('start_date', options.start_date);
    if (options.end_date) params = params.set('end_date', options.end_date);
    
    // Log params in a way that's compatible with all Angular versions
    const paramObj: {[key: string]: string} = {};
    params.keys().forEach(key => {
      paramObj[key] = params.get(key) || '';
    });
    console.log('Fetching my payments with params:', paramObj);
    
    return this.http.get<PaymentSummary[]>(`${this.apiUrl}/me`, { params }).pipe(
      map(payments => payments || []),
      tap(payments => console.log(`Fetched ${payments.length} of my payments`)),
      switchMap(payments => this.enhancePaymentsWithMissingDetails(payments)),
      catchError(error => {
        console.error(`Error fetching my payments: ${error.message}`);
        return of([]);
      })
    );
  }
  
   /**
   * Get a specific payment by ID with guaranteed store name
   */
   getPayment(id: string, includeTimesheetDetails: boolean = false): Observable<Payment> {
    // Ensure ID is string format
    const safeId = IdUtils.ensureString(id);
    
    let params = new HttpParams();
    if (includeTimesheetDetails) {
      params = params.set('include_timesheet_details', 'true');
    }
    
    // First load all stores for reference
    return this.storeService.getStores().pipe(
      switchMap(stores => {
        // Create a map for quick lookups
        const storeMap = new Map();
        stores.forEach(store => {
          storeMap.set(store._id, store);
        });
        
        // Now get the payment
        return this.http.get<Payment>(`${this.apiUrl}/${safeId}`, { params }).pipe(
          tap(payment => console.log(`Fetched payment id=${safeId}`)),
          map(payment => {
            // Ensure store name is populated if store_id exists
            if (payment.store_id && storeMap.has(payment.store_id)) {
              payment.store_name = storeMap.get(payment.store_id).name;
            }
            
            return payment;
          }),
          catchError(error => {
            console.error(`Error fetching payment ${safeId}:`, error);
            return ErrorHandlingService.handleError<Payment>(`getPayment id=${safeId}`)(error);
          })
        );
      }),
      catchError(error => {
        console.error(`Error loading stores for payment: ${error.message}`);
        return throwError(() => new Error('Failed to load store data for payment'));
      })
    );
  }
  
  /**
 * Generate payments for a period
 */
generatePayments(request: PaymentGenerationRequest): Observable<Payment[]> {
  // Ensure dates are properly formatted as strings
  const safeRequest = {
    start_date: this.ensureDateFormat(request.start_date),
    end_date: this.ensureDateFormat(request.end_date)
  };
  
  console.log('Sending payment generation request with dates:', safeRequest);
  
  return this.http.post<Payment[]>(`${this.apiUrl}/generate`, safeRequest).pipe(
    tap(payments => console.log(`Generated ${payments?.length || 0} payments`)),
    map(payments => payments || []), // Ensure we always return an array even if the response is null
    catchError(error => {
      console.error('Error generating payments:', error);
      return ErrorHandlingService.handleError<Payment[]>('generatePayments')(error);
    })
  );
}
  
/**
 * Helper method to ensure dates are in the correct format
 * Converts any date input to YYYY-MM-DD string format
 */
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
  /**
   * Process a payment (mark as paid)
   */
  processPayment(id: string, data: PaymentStatusUpdate): Observable<Payment> {
    // Ensure ID is string format
    const safeId = IdUtils.ensureString(id);
    
    return this.http.post<Payment>(`${this.apiUrl}/${safeId}/process`, data).pipe(
      tap(payment => console.log(`Processed payment id=${safeId}`)),
      switchMap(payment => this.enhancePaymentWithMissingDetails(payment)),
      catchError(error => {
        console.error(`Error processing payment ${safeId}:`, error);
        return ErrorHandlingService.handleError<Payment>(`processPayment id=${safeId}`)(error);
      })
    );
  }
  
  /**
   * Confirm receipt of payment
   */
  confirmPayment(id: string, data: PaymentConfirmation): Observable<Payment> {
    // Ensure ID is string format
    const safeId = IdUtils.ensureString(id);
    
    return this.http.post<Payment>(`${this.apiUrl}/${safeId}/confirm`, data).pipe(
      tap(payment => console.log(`Confirmed payment id=${safeId}`)),
      switchMap(payment => this.enhancePaymentWithMissingDetails(payment)),
      catchError(error => {
        console.error(`Error confirming payment ${safeId}:`, error);
        return ErrorHandlingService.handleError<Payment>(`confirmPayment id=${safeId}`)(error);
      })
    );
  }
  
  /**
   * Dispute a payment
   */
  disputePayment(id: string, data: PaymentDispute): Observable<Payment> {
    // Ensure ID is string format
    const safeId = IdUtils.ensureString(id);
    
    return this.http.post<Payment>(`${this.apiUrl}/${safeId}/dispute`, data).pipe(
      tap(payment => console.log(`Disputed payment id=${safeId}`)),
      switchMap(payment => this.enhancePaymentWithMissingDetails(payment)),
      catchError(error => {
        console.error(`Error disputing payment ${safeId}:`, error);
        return ErrorHandlingService.handleError<Payment>(`disputePayment id=${safeId}`)(error);
      })
    );
  }
  
  /**
   * Cancel a payment
   */
  cancelPayment(id: string, data: PaymentStatusUpdate): Observable<Payment> {
    // Ensure ID is string format
    const safeId = IdUtils.ensureString(id);
    
    return this.http.post<Payment>(`${this.apiUrl}/${safeId}/cancel`, data).pipe(
      tap(payment => console.log(`Cancelled payment id=${safeId}`)),
      switchMap(payment => this.enhancePaymentWithMissingDetails(payment)),
      catchError(error => {
        console.error(`Error cancelling payment ${safeId}:`, error);
        return ErrorHandlingService.handleError<Payment>(`cancelPayment id=${safeId}`)(error);
      })
    );
  }
  
  /**
   * Delete a payment
   */
  deletePayment(id: string): Observable<boolean> {
    // Ensure ID is string format
    const safeId = IdUtils.ensureString(id);
    
    return this.http.delete<boolean>(`${this.apiUrl}/${safeId}`).pipe(
      tap(_ => console.log(`Deleted payment id=${safeId}`)),
      catchError(error => {
        console.error(`Error deleting payment ${safeId}:`, error);
        return ErrorHandlingService.handleError<boolean>(`deletePayment id=${safeId}`)(error);
      })
    );
  }
  
  /**
   * Helper method to enhance a payment with employee and store information
   */
  private enhancePaymentWithMissingDetails(payment: Payment): Observable<Payment> {
    if (!payment) {
      return of(PaymentUtils.ensureComplete({}));
    }
    
    const enhancedPayment = PaymentUtils.ensureComplete(payment);
    
    // If both employee name and store name are present, return the payment as is
    if (enhancedPayment.employee_name && enhancedPayment.store_name) {
      return of(enhancedPayment);
    }
    
    const requests: Observable<any>[] = [];
    
    // Add employee info if missing
    if (!enhancedPayment.employee_name && enhancedPayment.employee_id) {
      requests.push(
        this.employeeService.getEmployeeById(enhancedPayment.employee_id).pipe(
          map(employee => {
            if (employee) {
              enhancedPayment.employee_name = employee.full_name;
              enhancedPayment.store_id = employee.store_id;
              enhancedPayment.store_name = employee.store_name;
            }
            return null;
          }),
          catchError(() => of(null))
        )
      );
    }
    
    // Add store info if missing but employee has store_id
    if (!enhancedPayment.store_name && enhancedPayment.store_id) {
      requests.push(
        this.storeService.getStoreById(enhancedPayment.store_id || '').pipe(
          map(store => {
            if (store) {
              enhancedPayment.store_name = store.name;
            }
            return null;
          }),
          catchError(() => of(null))
        )
      );
    }
    
    // If no enhancements needed, return the payment
    if (requests.length === 0) {
      return of(enhancedPayment);
    }
    
    // Run all enhancement requests and return the enhanced payment
    return forkJoin(requests).pipe(
      map(() => enhancedPayment)
    );
  }
  
  /**
   * Helper method to enhance multiple payments with employee and store information
   */
  private enhancePaymentsWithMissingDetails(payments: PaymentSummary[]): Observable<PaymentSummary[]> {
    if (!payments || payments.length === 0) {
      return of([]);
    }
    
    // Get unique employee IDs and store IDs
    const employeeIds = Array.from(new Set(payments
      .filter(p => !!p.employee_id && !p.employee_name)
      .map(p => p.employee_id)));
      
    const storeIds = Array.from(new Set(payments
      .filter(p => !!p.store_id && !p.store_name)
      .map(p => p.store_id)));
    
    // If no missing information, return payments as is
    if (employeeIds.length === 0 && storeIds.length === 0) {
      return of(payments);
    }
    
    // Create observables for fetching employee and store data
    const employeeRequests: Observable<any>[] = employeeIds.map(id => 
      this.employeeService.getEmployeeById(id).pipe(
        catchError(error => {
          console.error(`Error fetching employee info for ID ${id}:`, error);
          return of(null);
        })
      )
    );
    
    const storeRequests: Observable<any>[] = storeIds.map(id => 
      this.storeService.getStoreById(id || '').pipe(
        catchError(error => {
          console.error(`Error fetching store info for ID ${id}:`, error);
          return of(null);
        })
      )
    );
    
    // Combine all requests
    return forkJoin({
      employees: employeeIds.length ? forkJoin(employeeRequests) : of([]),
      stores: storeIds.length ? forkJoin(storeRequests) : of([])
    }).pipe(
      map(({ employees, stores }) => {
        // Create maps for quick lookups
        const employeeMap = new Map();
        employees.forEach(employee => {
          if (employee) {
            employeeMap.set(employee._id, employee);
          }
        });
        
        const storeMap = new Map();
        stores.forEach(store => {
          if (store) {
            storeMap.set(store._id, store);
          }
        });
        
        // Enhance each payment with employee and store data
        return payments.map(payment => {
          const enhancedPayment = { ...payment };
          
          if (!enhancedPayment.employee_name && enhancedPayment.employee_id && employeeMap.has(enhancedPayment.employee_id)) {
            const employee = employeeMap.get(enhancedPayment.employee_id);
            enhancedPayment.employee_name = employee.full_name;
            
            // Also set store info if not already set
            if (!enhancedPayment.store_id && employee.store_id) {
              enhancedPayment.store_id = employee.store_id;
              enhancedPayment.store_name = employee.store_name;
            }
          }
          
          if (!enhancedPayment.store_name && enhancedPayment.store_id && storeMap.has(enhancedPayment.store_id)) {
            const store = storeMap.get(enhancedPayment.store_id);
            enhancedPayment.store_name = store.name;
          }
          
          return enhancedPayment;
        });
      })
    );
  }
}