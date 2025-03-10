// src/app/features/employees/employee-management/employee-form/employee-form.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { EmployeeService } from '../../../../core/services/employee.service';
import { StoreService } from '../../../../core/services/store.service';
import { UserService } from '../../../../core/services/user.service';
import { PermissionService } from '../../../../core/auth/permission.service';
import { Employee } from '../../../../shared/models/employee.model';
import { Store } from '../../../../shared/models/store.model';
import { User } from '../../../../shared/models/user.model';
import { HasPermissionDirective } from '../../../../shared/directives/has-permission.directive';

@Component({
  selector: 'app-employee-form',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule, HasPermissionDirective],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h1 class="page-title">{{ isEditMode ? 'Edit Employee' : 'Create New Employee' }}</h1>
        <div class="flex flex-col sm:flex-row gap-4">
          <button routerLink="/employees" class="btn btn-outline flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Employees
          </button>
          
          <button *ngIf="isEditMode" [routerLink]="['/employees', employeeId]" class="btn btn-outline flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            View Employee
          </button>
        </div>
      </div>
      
      <!-- Loading state -->
      <div *ngIf="loading" class="flex justify-center items-center p-8">
        <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500"></div>
      </div>
      
      <!-- Error message -->
      <div *ngIf="error" class="alert alert-danger mb-6">
        {{ error }}
      </div>
      
      <!-- Success message -->
      <div *ngIf="successMessage" class="alert alert-success mb-6">
        {{ successMessage }}
      </div>
      
      <!-- Employee form -->
      <div *ngIf="!loading" class="card">
        <form [formGroup]="employeeForm" (ngSubmit)="onSubmit()">
          <!-- Basic Information Section -->
          <h3 class="text-lg font-medium mb-4">Basic Information</h3>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <!-- User Account (when creating new employee) -->
            <div *ngIf="!isEditMode" class="form-group md:col-span-2">
              <label for="user_id" class="form-label">Associate with User Account</label>
              <select 
                id="user_id" 
                formControlName="user_id"
                class="form-control"
              >
                <option value="">Create without user account</option>
                <option *ngFor="let user of availableUsers" [value]="user._id">
                  {{ user.full_name }} ({{ user.email }})
                </option>
                </select>
              <p class="text-xs text-[var(--text-secondary)] mt-1">
                Optionally link this employee to an existing user account for login access
              </p>
            </div>
            
            <!-- Position -->
            <div class="form-group">
              <label for="position" class="form-label required">Position</label>
              <input 
                type="text" 
                id="position" 
                formControlName="position"
                class="form-control"
                [ngClass]="{'border-red-500 dark:border-red-400': submitted && f['position'].errors}"
              >
              <div *ngIf="submitted && f['position'].errors" class="form-error">
                <div *ngIf="f['position'].errors['required']">Position is required</div>
              </div>
            </div>
            
            <!-- Hire Date -->
            <div class="form-group">
              <label for="hire_date" class="form-label required">Hire Date</label>
              <input 
                type="date" 
                id="hire_date" 
                formControlName="hire_date"
                class="form-control"
                [ngClass]="{'border-red-500 dark:border-red-400': submitted && f['hire_date'].errors}"
              >
              <div *ngIf="submitted && f['hire_date'].errors" class="form-error">
                <div *ngIf="f['hire_date'].errors['required']">Hire date is required</div>
              </div>
            </div>
            
            <!-- Hourly Rate -->
            <div class="form-group">
              <label for="hourly_rate" class="form-label required">Hourly Rate ($)</label>
              <input 
                type="number" 
                id="hourly_rate" 
                formControlName="hourly_rate"
                step="0.01"
                min="0"
                class="form-control"
                [ngClass]="{'border-red-500 dark:border-red-400': submitted && f['hourly_rate'].errors}"
              >
              <div *ngIf="submitted && f['hourly_rate'].errors" class="form-error">
                <div *ngIf="f['hourly_rate'].errors['required']">Hourly rate is required</div>
                <div *ngIf="f['hourly_rate'].errors['min']">Hourly rate must be greater than 0</div>
              </div>
            </div>
            
            <!-- Store Assignment -->
            <div class="form-group">
              <label for="store_id" class="form-label">Store Assignment</label>
              <select 
                id="store_id" 
                formControlName="store_id"
                class="form-control"
              >
                <option value="">No store assignment</option>
                <option *ngFor="let store of availableStores" [value]="store._id">
                  {{ store.name }} ({{ store.city }}, {{ store.state }})
                </option>
              </select>
            </div>
            
            <!-- Employment Status -->
            <div class="form-group">
              <label for="employment_status" class="form-label required">Employment Status</label>
              <select 
                id="employment_status" 
                formControlName="employment_status"
                class="form-control"
                [ngClass]="{'border-red-500 dark:border-red-400': submitted && f['employment_status'].errors}"
              >
                <option value="active">Active</option>
                <option value="on_leave">On Leave</option>
                <option value="terminated">Terminated</option>
              </select>
              <div *ngIf="submitted && f['employment_status'].errors" class="form-error">
                <div *ngIf="f['employment_status'].errors['required']">Employment status is required</div>
              </div>
            </div>
          </div>
          
          <!-- Contact Information Section -->
          <h3 class="text-lg font-medium mb-4">Contact Information</h3>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <!-- Address -->
            <div class="form-group">
              <label for="address" class="form-label">Address</label>
              <input 
                type="text" 
                id="address" 
                formControlName="address"
                class="form-control"
              >
            </div>
            
            <!-- City -->
            <div class="form-group">
              <label for="city" class="form-label">City</label>
              <input 
                type="text" 
                id="city" 
                formControlName="city"
                class="form-control"
              >
            </div>
            
            <!-- State -->
            <div class="form-group">
              <label for="state" class="form-label">State</label>
              <input 
                type="text" 
                id="state" 
                formControlName="state"
                class="form-control"
              >
            </div>
            
            <!-- Zip Code -->
            <div class="form-group">
              <label for="zip_code" class="form-label">Zip Code</label>
              <input 
                type="text" 
                id="zip_code" 
                formControlName="zip_code"
                class="form-control"
              >
            </div>
          </div>
          
          <!-- Emergency Contact Section -->
          <h3 class="text-lg font-medium mb-4">Emergency Contact</h3>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <!-- Emergency Contact Name -->
            <div class="form-group">
              <label for="emergency_contact_name" class="form-label">Name</label>
              <input 
                type="text" 
                id="emergency_contact_name" 
                formControlName="emergency_contact_name"
                class="form-control"
              >
            </div>
            
            <!-- Emergency Contact Phone -->
            <div class="form-group">
              <label for="emergency_contact_phone" class="form-label">Phone</label>
              <input 
                type="tel" 
                id="emergency_contact_phone" 
                formControlName="emergency_contact_phone"
                class="form-control"
              >
            </div>
          </div>
          
          <!-- Form Actions -->
          <div class="flex justify-end space-x-4 mt-6 pt-6 border-t border-[var(--border-color)]">
            <button 
              type="button" 
              class="btn btn-outline"
              (click)="resetForm()"
              [disabled]="submitting"
            >
              Reset
            </button>
            
            <button 
              type="submit"
              class="btn btn-primary"
              [disabled]="submitting"
            >
              <span *ngIf="submitting" class="mr-2">
                <!-- Loading spinner -->
                <svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </span>
              {{ isEditMode ? 'Update Employee' : 'Create Employee' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .required:after {
      content: " *";
      color: #ef4444;
    }
  `]
})
export class EmployeeFormComponent implements OnInit {
  employeeForm: FormGroup;
  isEditMode = false;
  employeeId = '';
  loading = false;
  submitting = false;
  submitted = false;
  error = '';
  successMessage = '';
  
  // Available data for dropdown selections
  availableStores: Store[] = [];
  availableUsers: User[] = [];
  
  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private employeeService: EmployeeService,
    private storeService: StoreService,
    private userService: UserService,
    private permissionService: PermissionService
  ) {
    this.employeeForm = this.createEmployeeForm();
  }
  
  ngOnInit(): void {
    // Check if in edit mode
    this.isEditMode = this.route.snapshot.data['isEdit'] === true;
    this.employeeId = this.route.snapshot.paramMap.get('id') || '';
    
    // Load stores for assignment
    this.loadStores();
    
    // Load users for account linking (only in create mode)
    if (!this.isEditMode) {
      this.loadUsers();
    }
    
    if (this.isEditMode && this.employeeId) {
      this.loading = true;
      this.employeeService.getEmployeeById(this.employeeId).subscribe({
        next: (employee) => {
          this.updateFormWithEmployeeData(employee);
          this.loading = false;
        },
        error: (err) => {
          this.error = 'Failed to load employee data. Please try again later.';
          this.loading = false;
          console.error('Error loading employee:', err);
        }
      });
    }
  }
  
  // Convenience getter for form fields
  get f() { return this.employeeForm.controls; }
  
  createEmployeeForm(): FormGroup {
    return this.fb.group({
      user_id: [''],
      position: ['', Validators.required],
      hire_date: ['', Validators.required],
      store_id: [''],
      hourly_rate: [15.00, [Validators.required, Validators.min(0)]],
      employment_status: ['active', Validators.required],
      emergency_contact_name: [''],
      emergency_contact_phone: [''],
      address: [''],
      city: [''],
      state: [''],
      zip_code: ['']
    });
  }
  
  updateFormWithEmployeeData(employee: Employee): void {
    // Format the date for the date input (YYYY-MM-DD)
    let hireDate = '';
    if (employee.hire_date) {
      const date = new Date(employee.hire_date);
      hireDate = date.toISOString().split('T')[0];
    }
    
    this.employeeForm.patchValue({
      position: employee.position,
      hire_date: hireDate,
      store_id: employee.store_id || '',
      hourly_rate: employee.hourly_rate,
      employment_status: employee.employment_status,
      emergency_contact_name: employee.emergency_contact_name || '',
      emergency_contact_phone: employee.emergency_contact_phone || '',
      address: employee.address || '',
      city: employee.city || '',
      state: employee.state || '',
      zip_code: employee.zip_code || ''
    });
    
    // Disable user_id field in edit mode
    this.employeeForm.get('user_id')?.disable();
  }
  
  loadStores(): void {
    // Get active stores only
    this.storeService.getStores({ is_active: true }).subscribe({
      next: (stores) => {
        this.availableStores = stores;
      },
      error: (err) => {
        console.error('Error loading stores:', err);
      }
    });
  }
  
  loadUsers(): void {
    // Get users without filtering
    this.userService.getUsers().subscribe({
      next: (users) => {
        // Just use all available users since we don't have a way to know which ones are already linked to employees
        this.availableUsers = users;
        
        // Alternatively, you could retrieve all employees and filter based on that
        // This approach would require an additional API call
        /*
        this.employeeService.getEmployees().subscribe({
          next: (employees) => {
            // Get the set of user IDs that are already associated with employees
            const linkedUserIds = new Set(
              employees
                .filter(emp => emp.user_id)
                .map(emp => emp.user_id)
            );
            
            // Filter out users that already have employee records
            this.availableUsers = users.filter(user => !linkedUserIds.has(user._id));
          }
        });
        */
      },
      error: (err) => {
        console.error('Error loading users:', err);
      }
    });
  }
  
  resetForm(): void {
    if (this.isEditMode) {
      // Reload employee data
      this.loading = true;
      this.employeeService.getEmployeeById(this.employeeId).subscribe({
        next: (employee) => {
          this.updateFormWithEmployeeData(employee);
          this.loading = false;
        },
        error: (err) => {
          this.error = 'Failed to reset form. Please reload the page.';
          this.loading = false;
          console.error('Error resetting form:', err);
        }
      });
    } else {
      // Create mode - just reset the form
      this.employeeForm.reset({
        employment_status: 'active',
        hourly_rate: 15.00
      });
      this.submitted = false;
    }
  }
  
  onSubmit(): void {
    this.submitted = true;
    this.error = '';
    this.successMessage = '';
    
    if (this.employeeForm.invalid) {
      return;
    }
    
    this.submitting = true;
    
    // Prepare data for API
    const employeeData: Partial<Employee> = {
      position: this.f['position'].value,
      store_id: this.f['store_id'].value || null,
      hourly_rate: this.f['hourly_rate'].value,
      employment_status: this.f['employment_status'].value,
      emergency_contact_name: this.f['emergency_contact_name'].value || null,
      emergency_contact_phone: this.f['emergency_contact_phone'].value || null,
      address: this.f['address'].value || null,
      city: this.f['city'].value || null,
      state: this.f['state'].value || null,
      zip_code: this.f['zip_code'].value || null
    };
    
    // Convert the date to ISO format
    if (this.f['hire_date'].value) {
      // Create a date object from the form's date string (YYYY-MM-DD)
      const dateObject = new Date(this.f['hire_date'].value);
      // Convert to ISO string format
      employeeData.hire_date = dateObject.toISOString();
    }
    
    // Include user_id only in create mode
    if (!this.isEditMode && this.f['user_id'].value) {
      employeeData.user_id = this.f['user_id'].value;
    }
    
    console.log('Submitting employee data:', employeeData);
    
    if (this.isEditMode) {
      // Update existing employee
      this.employeeService.updateEmployee(this.employeeId, employeeData).subscribe({
        next: (employee) => {
          this.successMessage = 'Employee updated successfully.';
          this.submitting = false;
          
          // Redirect after a brief delay
          setTimeout(() => {
            this.router.navigate(['/employees', this.employeeId]);
          }, 1500);
        },
        error: (err) => {
          console.error('Error response details:', err);
          
          // Extract detailed error information if available
          if (err.error && err.error.detail) {
            if (Array.isArray(err.error.detail)) {
              // Format FastAPI validation errors
              const errorDetails = err.error.detail.map((item: { loc: string | any[]; msg: any; }) => 
                `${item.loc[item.loc.length-1]}: ${item.msg}`
              ).join('; ');
              this.error = `Validation error: ${errorDetails}`;
            } else {
              this.error = `Error: ${err.error.detail}`;
            }
          } else {
            this.error = err.message || 'Failed to update employee. Please try again later.';
          }
          
          this.submitting = false;
        }
      });
    } else {
      // Create new employee
      this.employeeService.createEmployee(employeeData).subscribe({
        next: (employee) => {
          this.successMessage = 'Employee created successfully.';
          this.submitting = false;
          
          // Redirect after a brief delay
          setTimeout(() => {
            if (employee && employee._id) {
              this.router.navigate(['/employees', employee._id]);
            } else {
              // If we don't have an ID, just go back to the employee list
              this.router.navigate(['/employees']);
            }
          }, 1500);
        },
        error: (err) => {
          console.error('Error response details:', err);
          
          // Extract detailed error information if available
          if (err.error && err.error.detail) {
            if (Array.isArray(err.error.detail)) {
              // Format FastAPI validation errors
              const errorDetails = err.error.detail.map((item: { loc: string | any[]; msg: any; }) => 
                `${item.loc[item.loc.length-1]}: ${item.msg}`
              ).join('; ');
              this.error = `Validation error: ${errorDetails}`;
            } else {
              this.error = `Error: ${err.error.detail}`;
            }
          } else {
            this.error = err.message || 'Failed to create employee. Please try again later.';
          }
          
          this.submitting = false;
        }
      });
    }
  }
}