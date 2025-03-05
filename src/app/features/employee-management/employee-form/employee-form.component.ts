// src/app/features/employee-management/employee-form/employee-form.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { Employee, EmployeeCreate, EmployeeUpdate } from '../../../shared/models/employee.model';
import { Store } from '../../../shared/models/store.model';
import { Role } from '../../../shared/models/role.model';
import { EmployeeService } from '../../../core/services/employee.service';
import { StoreService } from '../../../core/services/store.service';
import { RoleService } from '../../../core/services/role.service';
import { AuthService } from '../../../core/services/auth.service';
import { catchError } from 'rxjs/operators';
import { of, Subscription } from 'rxjs';

@Component({
  selector: 'app-employee-form',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDividerModule
  ],
  templateUrl: './employee-form.component.html',
  styleUrls: ['./employee-form.component.scss']
})
export class EmployeeFormComponent implements OnInit, OnDestroy {
  employeeForm!: FormGroup;
  employeeId: string = '';
  isEditMode = false;
  isLoading = false;
  stores: Store[] = [];
  roles: Role[] = [];
  isAdmin = false;
  isManager = false;
  managedStoreId = '';
  submitInProgress = false;
  error: string = '';
  
  private userSubscription: Subscription | null = null;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private employeeService: EmployeeService,
    private storeService: StoreService,
    private roleService: RoleService,
    private authService: AuthService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.loadStores();
    this.loadRoles();
    this.checkUserRole();
    
    this.employeeId = this.route.snapshot.paramMap.get('id') || '';
    this.isEditMode = !!this.employeeId;
    
    if (this.isEditMode) {
      this.loadEmployeeData();
    }
  }
  
  ngOnDestroy(): void {
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
  }

  initializeForm(): void {
    this.employeeForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      user_id: ['', Validators.required], 
      full_name: ['', Validators.required],
      phone_number: [''],
      is_active: [true],
      position: ['', Validators.required],
      hourly_rate: [0, [Validators.required, Validators.min(0)]],
      employment_status: ['active'],
      emergency_contact_name: [''],
      emergency_contact_phone: [''],
      address: [''],
      city: [''],
      state: [''],
      zip_code: [''],
      store_id: [''],
      hire_date: [new Date()],
      role_id: [''],
      password: ['', this.isEditMode ? [] : Validators.required]
    });
  }

  loadStores(): void {
    this.storeService.getStores().subscribe({
      next: (stores) => {
        this.stores = stores;
      },
      error: (error) => {
        this.error = error.message || 'Error loading stores';
        console.error('Error loading stores:', error);
        this.snackBar.open('Error loading stores: ' + this.error, 'Close', { duration: 3000 });
      }
    });
  }

  loadRoles(): void {
    this.roleService.getRoles().subscribe({
      next: (roles) => {
        this.roles = roles;
      },
      error: (error) => {
        this.error = error.message || 'Error loading roles';
        console.error('Error loading roles:', error);
        this.snackBar.open('Error loading roles: ' + this.error, 'Close', { duration: 3000 });
      }
    });
  }

  checkUserRole(): void {
    this.userSubscription = this.authService.user$.subscribe(user => {
      if (user) {
        // Check permissions using standardized format
        this.isAdmin = this.authService.hasPermission('users', 'approve');
        this.isManager = this.authService.hasPermission('employees', 'approve') && 
                        !this.isAdmin;
        
        // For managed_store_id we still need to access it
        this.managedStoreId = (user as any).managed_store_id || '';
        
        // If manager, pre-select their store
        if (this.isManager && this.managedStoreId) {
          this.employeeForm.patchValue({ store_id: this.managedStoreId });
          this.employeeForm.get('store_id')?.disable();
        }
      }
    });
  }

  loadEmployeeData(): void {
    this.isLoading = true;
    this.error = '';
    
    this.employeeService.getEmployeeById(this.employeeId)
      .pipe(
        catchError(error => {
          this.isLoading = false;
          this.error = error.message || 'Error loading employee data';
          console.error('Error loading employee data:', error);
          this.snackBar.open('Error loading employee data: ' + this.error, 'Close', { duration: 3000 });
          this.router.navigate(['/employees']);
          return of(null);
        })
      )
      .subscribe(employee => {
        this.isLoading = false;
        
        if (employee) {
          // Remove password field in edit mode
          this.employeeForm.removeControl('password');
          
          // Format the hire date properly
          const hireDate = employee.hire_date ? new Date(employee.hire_date) : new Date();
          
          // Map employee data to form
          this.employeeForm.patchValue({
            email: employee.email,
            full_name: employee.full_name,
            phone_number: employee.phone_number || '',
            is_active: employee.is_active,
            position: employee.position,
            hourly_rate: employee.hourly_rate,
            employment_status: employee.employment_status,
            emergency_contact_name: employee.emergency_contact_name || '',
            emergency_contact_phone: employee.emergency_contact_phone || '',
            address: employee.address || '',
            city: employee.city || '',
            state: employee.state || '',
            zip_code: employee.zip_code || '',
            store_id: employee.store_id || '',
            hire_date: hireDate,
            role_id: employee.role_id || ''
          });
          
          // If manager, enforce store selection to their managed store
          if (this.isManager && this.managedStoreId) {
            this.employeeForm.patchValue({ store_id: this.managedStoreId });
            this.employeeForm.get('store_id')?.disable();
          }
        }
      });
  }

  onSubmit(): void {
    debugger;
    if (this.employeeForm.invalid) {
      this.markFormGroupTouched(this.employeeForm);
      return;
    }
    
    this.submitInProgress = true;
    this.error = '';
    
    // Get form values and handle disabled controls
    const formData = { ...this.employeeForm.getRawValue() };
    
    // Format the hire date properly for API
    if (formData.hire_date instanceof Date) {
      formData.hire_date = formData.hire_date.toISOString();
    }
    
    if (this.isEditMode) {
      // Remove empty strings to avoid overwriting with empty values
      Object.keys(formData).forEach(key => {
        if (formData[key] === '') {
          delete formData[key];
        }
      });
      console.log('Sending employee data to API:', formData);

      this.employeeService.updateEmployee(this.employeeId, formData as EmployeeUpdate)
        .pipe(
          catchError(error => {
            this.submitInProgress = false;
            this.error = error.message || 'Error updating employee';
            console.error('Error updating employee:', error);
            this.snackBar.open('Error updating employee: ' + this.error, 'Close', { duration: 3000 });
            return of(null);
          })
        )
        .subscribe(employee => {
          this.submitInProgress = false;
          
          if (employee) {
            this.snackBar.open('Employee updated successfully', 'Close', { duration: 3000 });
            this.router.navigate(['/employees', this.employeeId]);
          }
        });
    } else {
      this.employeeService.createEmployee(formData as EmployeeCreate)
      .pipe(
        catchError(error => {
          this.submitInProgress = false;
          // Log the full error object
          console.error('Full error object:', error);
          this.error = error.message || 'Error creating employee';
          console.error('Error creating employee:', error);
          this.snackBar.open('Error creating employee: ' + this.error, 'Close', { duration: 3000 });
          return of(null);
        })
      ).subscribe(employee => {
          this.submitInProgress = false;
          
          if (employee) {
            this.snackBar.open('Employee created successfully', 'Close', { duration: 3000 });
            this.router.navigate(['/employees']);
          }
        });
    }
  }

  markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  onCancel(): void {
    if (this.isEditMode) {
      this.router.navigate(['/employees', this.employeeId]);
    } else {
      this.router.navigate(['/employees']);
    }
  }
}