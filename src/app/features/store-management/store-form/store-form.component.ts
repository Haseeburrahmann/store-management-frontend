// src/app/features/store-management/store-form/store-form.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { StoreService } from '../../../core/auth/services/store.service';
import { UserService } from '../../../core/auth/services/user.service';
import { RoleService } from '../../../core/auth/services/role.service';
import { Store, StoreCreate, StoreUpdate } from '../../../shared/models/store.model';

@Component({
  selector: 'app-store-form',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatCardModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatCheckboxModule,
    MatIconModule
  ],
  templateUrl: './store-form.component.html',
  styleUrls: ['./store-form.component.scss']
})
export class StoreFormComponent implements OnInit {
  storeForm: FormGroup;
  isEditMode = false;
  storeId: string | null = null;
  isLoading = false;
  managers: any[] = [];
  isLoadingManagers = false;

  constructor(
    private fb: FormBuilder,
    private storeService: StoreService,
    private userService: UserService,
    private roleService: RoleService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.storeForm = this.fb.group({
      name: ['', [Validators.required]],
      address: ['', [Validators.required]],
      city: ['', [Validators.required]],
      state: ['', [Validators.required]],
      zip_code: ['', [Validators.required]],
      phone: ['', [Validators.required]],
      email: ['', [Validators.email]],
      manager_id: [''],
      is_active: [true]
    });
  }

  ngOnInit(): void {
    this.loadManagers();
    
    this.storeId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.storeId;
    
    if (this.isEditMode && this.storeId) {
      this.loadStoreData(this.storeId);
    }
  }

  loadManagers(): void {
    this.isLoadingManagers = true;
    
    // First get the manager role ID
    this.roleService.getRoles().subscribe({
      next: (roles: any[]) => {
        const managerRole = roles.find((role: { name: string; }) => role.name === 'Manager');
        
        if (managerRole) {
          // Then get users with that role
          this.userService.getUsers().subscribe({
            next: (users: any[]) => {
              this.managers = users.filter(user => user.role_id === managerRole._id);
              console.log('Available managers:', this.managers);
              this.isLoadingManagers = false;
            },
            error: (error: any) => {
              console.error('Error loading users', error);
              this.isLoadingManagers = false;
            }
          });
        } else {
          console.error('Manager role not found');
          this.isLoadingManagers = false;
        }
      },
      error: (error: any) => {
        console.error('Error loading roles', error);
        this.isLoadingManagers = false;
      }
    });
  }

  loadStoreData(id: string): void {
    this.isLoading = true;
    this.storeService.getStore(id).subscribe({
      next: (store: any) => {
        this.storeForm.patchValue({
          name: store.name,
          address: store.address,
          city: store.city,
          state: store.state,
          zip_code: store.zip_code,
          phone: store.phone,
          email: store.email,
          manager_id: store.manager_id,
          is_active: store.is_active
        });
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error loading store data', error);
        this.isLoading = false;
      }
    });
  }

  onSubmit(): void {
    if (this.storeForm.invalid) {
      return;
    }

    this.isLoading = true;

    if (this.isEditMode && this.storeId) {
      const storeData: StoreUpdate = this.storeForm.value;
      this.storeService.updateStore(this.storeId, storeData).subscribe({
        next: () => {
          this.isLoading = false;
          this.router.navigate(['/stores']);
        },
        error: (error: any) => {
          console.error('Error updating store', error);
          this.isLoading = false;
        }
      });
    } else {
      const storeData: StoreCreate = this.storeForm.value;
      this.storeService.createStore(storeData).subscribe({
        next: () => {
          this.isLoading = false;
          this.router.navigate(['/stores']);
        },
        error: (error: any) => {
          console.error('Error creating store', error);
          this.isLoading = false;
        }
      });
    }
  }
}