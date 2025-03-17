// src/app/features/inventory/inventory-request-create/inventory-request-create.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { InventoryService } from '../../../core/services/inventory.service';
import { StoreService } from '../../../core/services/store.service';
import { EmployeeService } from '../../../core/services/employee.service';
import { AuthService } from '../../../core/auth/auth.service';
import { Store } from '../../../shared/models/store.model';
import { Employee } from '../../../shared/models/employee.model';

@Component({
  selector: 'app-inventory-request-create',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  templateUrl: './inventory-request-create.component.html',
  styleUrls: ['./inventory-request-create.component.scss']
})
export class InventoryRequestCreateComponent implements OnInit {
  requestForm: FormGroup;
  stores: Store[] = [];
  loading = false;
  submitting = false;
  error = '';
  success = false;
  
  // Unit type options
  unitTypes = ['single', 'box', 'packet', 'roll', 'carton', 'bundle', 'liter', 'kg'];
  
  constructor(
    private fb: FormBuilder,
    private inventoryService: InventoryService,
    private storeService: StoreService,
    private employeeService: EmployeeService,
    private authService: AuthService,
    private router: Router
  ) {
    this.requestForm = this.createForm();
  }
  
  ngOnInit(): void {
    this.loadStores();
  }
  
  createForm(): FormGroup {
    return this.fb.group({
      store_id: ['', Validators.required],
      items: this.fb.array([this.createItemFormGroup()]),
      notes: ['']
    });
  }
  
  createItemFormGroup(): FormGroup {
    return this.fb.group({
      name: ['', Validators.required],
      quantity: [1, [Validators.required, Validators.min(0.1)]],
      unit_type: ['single', Validators.required],
      notes: ['']
    });
  }
  
  get itemsFormArray(): FormArray {
    return this.requestForm.get('items') as FormArray;
  }
  
  loadStores(): void {
    this.loading = true;
    
    this.storeService.getStores().subscribe({
      next: (stores) => {
        this.stores = stores;
        
        // If employee is associated with a specific store, select it by default
        this.employeeService.getEmployeeByUserId(this.authService.currentUser?._id || '').subscribe({
          next: (employee) => {
            if (employee && employee.store_id) {
              this.requestForm.get('store_id')?.setValue(employee.store_id);
            } else if (this.stores.length === 1) {
              // If there's only one store, select it by default
              this.requestForm.get('store_id')?.setValue(this.stores[0]._id);
            }
            this.loading = false;
          },
          error: () => {
            if (this.stores.length === 1) {
              // If there's only one store, select it by default
              this.requestForm.get('store_id')?.setValue(this.stores[0]._id);
            }
            this.loading = false;
          }
        });
      },
      error: (err) => {
        console.error('Error loading stores:', err);
        this.error = 'Failed to load stores. Please try again later.';
        this.loading = false;
      }
    });
  }
  
  addItem(): void {
    this.itemsFormArray.push(this.createItemFormGroup());
  }
  
  removeItem(index: number): void {
    if (this.itemsFormArray.length > 1) {
      this.itemsFormArray.removeAt(index);
    }
  }
  
  onSubmit(): void {
    if (this.requestForm.invalid) {
      // Mark all fields as touched to trigger validation messages
      this.markFormGroupTouched(this.requestForm);
      return;
    }
    
    this.submitting = true;
    this.error = '';
    
    this.inventoryService.createInventoryRequest(this.requestForm.value).subscribe({
      next: (request) => {
        this.success = true;
        this.submitting = false;
        
        // Redirect to the request detail page after a short delay
        setTimeout(() => {
          this.router.navigate(['/inventory', request._id]);
        }, 1500);
      },
      error: (err) => {
        console.error('Error creating inventory request:', err);
        this.error = 'Failed to create inventory request. Please try again later.';
        this.submitting = false;
      }
    });
  }
  
  cancel(): void {
    this.router.navigate(['/inventory']);
  }
  
  // Helper method to mark all controls in a form group as touched
  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      } else if (control instanceof FormArray) {
        control.controls.forEach(arrayControl => {
          if (arrayControl instanceof FormGroup) {
            this.markFormGroupTouched(arrayControl);
          } else {
            arrayControl.markAsTouched();
          }
        });
      }
    });
  }
  
  // Helper method to check form control validity for template
  isInvalid(controlName: string, formGroup: FormGroup = this.requestForm): boolean {
    const control = formGroup.get(controlName);
    return control !== null && control.invalid && control.touched;
  }
  
  // Helper method to check item form control validity
  isItemInvalid(controlName: string, index: number): boolean {
    const itemGroup = this.itemsFormArray.at(index) as FormGroup;
    return this.isInvalid(controlName, itemGroup);
  }
}