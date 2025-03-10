// src/app/features/employees/employee-management/employee-detail/employee-detail.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { EmployeeService } from '../../../../core/services/employee.service';
import { StoreService } from '../../../../core/services/store.service';
import { PermissionService } from '../../../../core/auth/permission.service';
import { Employee } from '../../../../shared/models/employee.model';
import { Store } from '../../../../shared/models/store.model';
import { HasPermissionDirective } from '../../../../shared/directives/has-permission.directive';

@Component({
  selector: 'app-employee-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, HasPermissionDirective],
  templateUrl: './employee-detail.component.html'
})
export class EmployeeDetailComponent implements OnInit {
  employeeId: string = '';
  employee: Employee | null = null;
  loading = true;
  error = '';
  
  // Available stores for assignment
  availableStores: Store[] = [];
  selectedStoreId: string = '';
  
  // Store assignment
  assigningStore = false;
  storeUpdateMessage = '';
  storeUpdateError = false;
  
  // Status management
  changingStatus = false;
  statusUpdateMessage = '';
  statusUpdateError = false;
  
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private employeeService: EmployeeService,
    private storeService: StoreService,
    private permissionService: PermissionService
  ) {}
  
  ngOnInit(): void {
    this.employeeId = this.route.snapshot.paramMap.get('id') || '';
    this.loadEmployee();
    
    // Load available stores if user has permission
    if (this.permissionService.hasPermission('employees:write')) {
      this.loadStores();
    }
  }
  
  loadEmployee(): void {
    this.loading = true;
    this.error = '';
    
    if (!this.employeeId) {
      this.error = 'Employee ID is required';
      this.loading = false;
      return;
    }
    
    this.employeeService.getEmployeeById(this.employeeId).subscribe({
      next: (employee) => {
        this.employee = employee;
        this.selectedStoreId = employee.store_id || '';
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load employee. Please try again later.';
        this.loading = false;
        console.error('Error loading employee:', err);
      }
    });
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
  
  getEmployeeInitials(): string {
    if (!this.employee?.full_name) return 'E';
    
    const names = this.employee.full_name.split(' ');
    if (names.length === 1) return names[0].charAt(0).toUpperCase();
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
  }
  
  getStatusLabel(status: string): string {
    switch (status) {
      case 'active': return 'Active';
      case 'on_leave': return 'On Leave';
      case 'terminated': return 'Terminated';
      default: return status;
    }
  }
  
  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'on_leave':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'terminated':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  }
  
  assignStore(): void {
    if (!this.employee) {
      return;
    }
    
    this.assigningStore = true;
    this.storeUpdateMessage = '';
    this.storeUpdateError = false;
    
    this.employeeService.assignEmployeeToStore(this.employeeId, this.selectedStoreId).subscribe({
      next: (updatedEmployee) => {
        this.employee = updatedEmployee;
        
        // Update store name display
        if (!this.selectedStoreId) {
          this.employee.store_name = '';
        } else {
          const store = this.availableStores.find(s => s._id === this.selectedStoreId);
          if (store) {
            this.employee.store_name = store.name;
          }
        }
        
        this.storeUpdateMessage = this.selectedStoreId 
          ? 'Employee assigned to store successfully.' 
          : 'Employee removed from store successfully.';
        this.storeUpdateError = false;
        this.assigningStore = false;
        
        setTimeout(() => {
          this.storeUpdateMessage = '';
        }, 3000);
      },
      error: (err) => {
        this.storeUpdateMessage = 'Failed to assign store. Please try again later.';
        this.storeUpdateError = true;
        this.assigningStore = false;
        console.error('Error assigning store:', err);
      }
    });
  }
  
  changeStatus(status: 'active' | 'on_leave' | 'terminated'): void {
    if (!this.employee || this.employee.employment_status === status) {
      return;
    }
    
    this.changingStatus = true;
    this.statusUpdateMessage = '';
    this.statusUpdateError = false;
    
    this.employeeService.changeEmploymentStatus(this.employeeId, status).subscribe({
      next: (updatedEmployee) => {
        this.employee = updatedEmployee;
        this.statusUpdateMessage = `Employee status changed to ${this.getStatusLabel(status)} successfully.`;
        this.statusUpdateError = false;
        this.changingStatus = false;
        
        setTimeout(() => {
          this.statusUpdateMessage = '';
        }, 3000);
      },
      error: (err) => {
        this.statusUpdateMessage = 'Failed to change employee status. Please try again later.';
        this.statusUpdateError = true;
        this.changingStatus = false;
        console.error('Error changing employee status:', err);
      }
    });
  }
  
  deleteEmployee(): void {
    if (!this.employee) {
      return;
    }
    
    if (!confirm(`Are you sure you want to delete ${this.employee.full_name || 'this employee'}? This action cannot be undone.`)) {
      return;
    }
    
    this.employeeService.deleteEmployee(this.employeeId).subscribe({
      next: (success) => {
        if (success) {
          this.router.navigate(['/employees']);
        } else {
          this.error = 'Failed to delete employee.';
        }
      },
      error: (err) => {
        this.error = 'Failed to delete employee. Please try again later.';
        console.error('Error deleting employee:', err);
      }
    });
  }
}