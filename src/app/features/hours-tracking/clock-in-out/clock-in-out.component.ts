// // src/app/features/hours-tracking/clock-in-out/clock-in-out.component.ts
// import { Component, OnInit, OnDestroy } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
// import { MatCardModule } from '@angular/material/card';
// import { MatFormFieldModule } from '@angular/material/form-field';
// import { MatInputModule } from '@angular/material/input';
// import { MatSelectModule } from '@angular/material/select';
// import { MatButtonModule } from '@angular/material/button';
// import { MatDatepickerModule } from '@angular/material/datepicker';
// import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
// import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

// // Updated import paths
// import { HoursService } from '../../../core/services/hours.service';
// import { StoreService } from '../../../core/services/store.service';
// import { EmployeeService } from '../../../core/services/employee.service';
// import { AuthService } from '../../../core/services/auth.service';
// import { ClockInRequest, ClockOutRequest, Hours } from '../../../shared/models/hours.model';
// import { Observable, of, Subscription, switchMap, catchError, finalize } from 'rxjs';
// import { Store } from '../../../shared/models/store.model';
// import { Employee } from '../../../shared/models/employee.model';

// @Component({
//   selector: 'app-clock-in-out',
//   standalone: true,
//   imports: [
//     CommonModule,
//     ReactiveFormsModule,
//     MatCardModule,
//     MatFormFieldModule,
//     MatInputModule,
//     MatSelectModule,
//     MatButtonModule,
//     MatDatepickerModule,
//     MatProgressSpinnerModule,
//     MatSnackBarModule
//   ],
//   template: `
//     <div class="container mx-auto p-4">
//       <h1 class="text-2xl font-bold mb-4">Clock In/Out</h1>
      
//       <mat-card class="mb-4">
//         <mat-card-header>
//           <mat-card-title>Current Status</mat-card-title>
//         </mat-card-header>
//         <mat-card-content>
//           <div *ngIf="loading" class="flex justify-center py-4">
//             <mat-spinner diameter="40"></mat-spinner>
//           </div>
          
//           <div *ngIf="!loading">
//             <div *ngIf="activeShift" class="p-4 bg-green-100 rounded mb-4">
//               <p class="text-lg font-semibold text-green-800">Currently Clocked In</p>
//               <p>Clock In Time: {{ formatDate(activeShift.clock_in) }}</p>
//               <p *ngIf="activeShift.break_start && !activeShift.break_end" class="text-yellow-600">
//                 On Break since {{ formatDate(activeShift.break_start) }}
//               </p>
//               <p *ngIf="activeShift.break_start && activeShift.break_end">
//                 Break: {{ formatDate(activeShift.break_start) }} to {{ formatDate(activeShift.break_end) }}
//               </p>
//             </div>
            
//             <div *ngIf="!activeShift" class="p-4 bg-gray-100 rounded mb-4">
//               <p class="text-lg font-semibold">Not Currently Clocked In</p>
//             </div>
//           </div>
//         </mat-card-content>
//       </mat-card>
      
//       <div *ngIf="!activeShift && !loading">
//         <mat-card>
//           <mat-card-header>
//             <mat-card-title>Clock In</mat-card-title>
//           </mat-card-header>
//           <mat-card-content>
//             <form [formGroup]="clockInForm" (ngSubmit)="onClockIn()" class="mt-4">
//               <div *ngIf="isManager" class="mb-4">
//                 <mat-form-field class="w-full">
//                   <mat-label>Employee</mat-label>
//                   <mat-select formControlName="employee_id" required>
//                     <mat-option *ngFor="let employee of employees" [value]="employee._id">
//                       {{ employee.full_name }}
//                     </mat-option>
//                   </mat-select>
//                   <mat-error *ngIf="clockInForm.get('employee_id')?.hasError('required')">
//                     Employee is required
//                   </mat-error>
//                 </mat-form-field>
//               </div>
              
//               <div class="mb-4">
//                 <mat-form-field class="w-full">
//                   <mat-label>Store</mat-label>
//                   <mat-select formControlName="store_id" required>
//                     <mat-option *ngFor="let store of stores" [value]="store._id">
//                       {{ store.name }}
//                     </mat-option>
//                   </mat-select>
//                   <mat-error *ngIf="clockInForm.get('store_id')?.hasError('required')">
//                     Store is required
//                   </mat-error>
//                 </mat-form-field>
//               </div>
              
//               <div class="mb-4">
//                 <mat-form-field class="w-full">
//                   <mat-label>Notes</mat-label>
//                   <textarea matInput formControlName="notes" rows="3"></textarea>
//                 </mat-form-field>
//               </div>
              
//               <button 
//                 mat-raised-button 
//                 color="primary" 
//                 type="submit" 
//                 [disabled]="clockInForm.invalid || submitting"
//                 class="w-full"
//               >
//                 <span *ngIf="!submitting">Clock In</span>
//                 <mat-spinner *ngIf="submitting" diameter="24" class="inline-block"></mat-spinner>
//               </button>
//             </form>
//           </mat-card-content>
//         </mat-card>
//       </div>
      
//       <div *ngIf="activeShift && !loading">
//         <mat-card>
//           <mat-card-header>
//             <mat-card-title>Clock Out</mat-card-title>
//           </mat-card-header>
//           <mat-card-content>
//             <form [formGroup]="clockOutForm" (ngSubmit)="onClockOut()" class="mt-4">
//               <div class="mb-4">
//                 <mat-form-field class="w-full">
//                   <mat-label>Break Start</mat-label>
//                   <input matInput [matDatepicker]="breakStartPicker" formControlName="break_start">
//                   <mat-datepicker-toggle matSuffix [for]="breakStartPicker"></mat-datepicker-toggle>
//                   <mat-datepicker #breakStartPicker></mat-datepicker>
//                 </mat-form-field>
//               </div>
              
//               <div class="mb-4">
//                 <mat-form-field class="w-full">
//                   <mat-label>Break End</mat-label>
//                   <input matInput [matDatepicker]="breakEndPicker" formControlName="break_end">
//                   <mat-datepicker-toggle matSuffix [for]="breakEndPicker"></mat-datepicker-toggle>
//                   <mat-datepicker #breakEndPicker></mat-datepicker>
//                 </mat-form-field>
//               </div>
              
//               <div class="mb-4">
//                 <mat-form-field class="w-full">
//                   <mat-label>Notes</mat-label>
//                   <textarea matInput formControlName="notes" rows="3"></textarea>
//                 </mat-form-field>
//               </div>
              
//               <button 
//                 mat-raised-button 
//                 color="warn" 
//                 type="submit" 
//                 [disabled]="submitting"
//                 class="w-full"
//               >
//                 <span *ngIf="!submitting">Clock Out</span>
//                 <mat-spinner *ngIf="submitting" diameter="24" class="inline-block"></mat-spinner>
//               </button>
//             </form>
//           </mat-card-content>
//         </mat-card>
//       </div>
//     </div>
//   `,
//   styles: [`
//     .container {
//       max-width: 600px;
//     }
//   `]
// })
// export class ClockInOutComponent implements OnInit, OnDestroy {
//   clockInForm: FormGroup;
//   clockOutForm: FormGroup;
//   activeShift: Hours | null = null;
//   employees: Employee[] = [];
//   stores: Store[] = [];
//   loading = false;
//   submitting = false;
//   isAdmin = false;
//   isManager = false;
//   currentUserId = '';
//   private userSubscription: Subscription | null = null;

//   constructor(
//     private fb: FormBuilder,
//     private hoursService: HoursService,
//     private storeService: StoreService,
//     private employeeService: EmployeeService,
//     private authService: AuthService,
//     private snackBar: MatSnackBar
//   ) {
//     this.clockInForm = this.fb.group({
//       employee_id: ['', Validators.required],
//       store_id: ['', Validators.required],
//       notes: ['']
//     });

//     this.clockOutForm = this.fb.group({
//       break_start: [null],
//       break_end: [null],
//       notes: ['']
//     });
//   }

//   ngOnInit(): void {
//     this.loading = true;
//     this.checkUserRole();
//   }

//   ngOnDestroy(): void {
//     if (this.userSubscription) {
//       this.userSubscription.unsubscribe();
//     }
//   }

//   checkUserRole(): void {
//     this.userSubscription = this.authService.user$.subscribe(user => {
//       if (user) {
//         this.currentUserId = user._id;
        
//         // Use hasPermission method to determine roles
//         this.isAdmin = this.authService.hasPermission('users', 'approve');
//         this.isManager = this.authService.hasPermission('employees', 'approve') && 
//                         !this.isAdmin; // Manager is someone with employee approve permissions but not admin
        
//         // Set employee_id to current user if not manager
//         if (!this.isManager && !this.isAdmin) {
//           this.clockInForm.patchValue({ employee_id: this.currentUserId });
//         }
        
//         // Load employee's active shift
//         this.checkActiveShift();
        
//         // Load stores
//         this.loadStores();
        
//         // Load employees if manager or admin
//         if (this.isManager || this.isAdmin) {
//           this.loadEmployees();
//         }
//       }
//     });
//   }

//   checkActiveShift(): void {
//     const employeeId = (this.isManager || this.isAdmin) ? 
//       this.clockInForm.get('employee_id')?.value : 
//       this.currentUserId;
      
//     if (employeeId) {
//       this.hoursService.getActiveShift(employeeId)
//         .pipe(
//           catchError(error => {
//             // 404 is expected if no active shift
//             if (error.status !== 404) {
//               this.snackBar.open('Error checking active shift', 'Close', { duration: 3000 });
//             }
//             return of(null);
//           }),
//           finalize(() => this.loading = false)
//         )
//         .subscribe(shift => {
//           this.activeShift = shift;
          
//           // If there's an active shift with break info, update the form
//           if (shift) {
//             this.clockOutForm.patchValue({
//               break_start: shift.break_start || null,
//               break_end: shift.break_end || null,
//               notes: shift.notes || ''
//             });
//           }
//         });
//     } else {
//       this.loading = false;
//     }
//   }

//   loadStores(): void {
//     this.storeService.getStores().subscribe({
//       next: (stores: Store[]) => {
//         this.stores = stores;
        
//         // If employee has a store assigned, set it as default
//         if (!this.isManager && !this.isAdmin && stores.length > 0) {
//           this.employeeService.getEmployeeById(this.currentUserId).subscribe({
//             next: (employee: Employee) => {
//               if (employee?.store_id) {
//                 this.clockInForm.patchValue({ store_id: employee.store_id });
//               }
//             },
//             error: (error) => {
//               this.snackBar.open('Error loading employee data', 'Close', { duration: 3000 });
//             }
//           });
//         }
//       },
//       error: (error) => {
//         this.snackBar.open('Error loading stores', 'Close', { duration: 3000 });
//       }
//     });
//   }

//   loadEmployees(): void {
//     this.employeeService.getEmployees().subscribe({
//       next: (employees: Employee[]) => {
//         this.employees = employees;
//       },
//       error: (error) => {
//         this.snackBar.open('Error loading employees', 'Close', { duration: 3000 });
//       }
//     });
//   }

//   onClockIn(): void {
//     if (this.clockInForm.valid) {
//       this.submitting = true;
      
//       const clockInData: ClockInRequest = this.clockInForm.value;
      
//       this.hoursService.clockIn(clockInData)
//         .pipe(finalize(() => this.submitting = false))
//         .subscribe({
//           next: (result) => {
//             this.snackBar.open('Successfully clocked in', 'Close', { duration: 3000 });
//             this.activeShift = result;
//           },
//           error: (error) => {
//             this.snackBar.open(error.error?.detail || 'Error clocking in', 'Close', { duration: 3000 });
//           }
//         });
//     }
//   }

//   onClockOut(): void {
//     if (this.activeShift) {
//       this.submitting = true;
      
//       const clockOutData: ClockOutRequest = this.clockOutForm.value;
//       const employeeId = this.activeShift.employee_id;
      
//       this.hoursService.clockOut(employeeId, clockOutData)
//         .pipe(finalize(() => this.submitting = false))
//         .subscribe({
//           next: (result) => {
//             this.snackBar.open('Successfully clocked out', 'Close', { duration: 3000 });
//             this.activeShift = null;
//             this.clockInForm.reset();
//             if (!this.isManager && !this.isAdmin) {
//               this.clockInForm.patchValue({ employee_id: this.currentUserId });
//             }
//           },
//           error: (error) => {
//             this.snackBar.open(error.error?.detail || 'Error clocking out', 'Close', { duration: 3000 });
//           }
//         });
//     }
//   }

//   formatDate(date: string | Date | undefined): string {
//     if (!date) return '';
//     return new Date(date).toLocaleString();
//   }
// }