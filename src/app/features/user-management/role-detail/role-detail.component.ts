// src/app/features/role-management/role-detail/role-detail.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatExpansionModule } from '@angular/material/expansion';

import { RoleService } from '../../../core/auth/services/role.service';

@Component({
  selector: 'app-role-detail',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCheckboxModule,
    MatChipsModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatExpansionModule,
    RouterModule
  ],
  template: `
    <div class="container">
      <mat-card>
        <mat-card-header>
          <mat-card-title>{{ isNewRole ? 'Create Role' : 'Edit Role' }}</mat-card-title>
        </mat-card-header>
        
        <mat-card-content>
          <div class="spinner-container" *ngIf="isLoading">
            <mat-spinner diameter="40"></mat-spinner>
          </div>
          
          <form [formGroup]="roleForm" (ngSubmit)="onSubmit()" *ngIf="!isLoading">
            <div class="form-row">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Name</mat-label>
                <input matInput formControlName="name" [readonly]="isDefaultRole">
                <mat-error *ngIf="roleForm.get('name')?.hasError('required')">
                  Name is required
                </mat-error>
              </mat-form-field>
            </div>
            
            <div class="form-row">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Description</mat-label>
                <textarea matInput formControlName="description" rows="3"></textarea>
              </mat-form-field>
            </div>
            
            <div class="form-row">
              <h3>Permissions</h3>
              
              <mat-accordion>
                <mat-expansion-panel *ngFor="let area of permissionAreas">
                  <mat-expansion-panel-header>
                    <mat-panel-title>
                      {{ area | titlecase }}
                    </mat-panel-title>
                    <mat-panel-description>
                      {{ getSelectedAreaPermissions(area).length }} permissions selected
                    </mat-panel-description>
                  </mat-expansion-panel-header>
                  
                  <div class="permissions-container">
                    <div *ngFor="let action of permissionActions" class="permission-checkbox">
                      <mat-checkbox [checked]="hasPermission(area, action)" 
                                  (change)="togglePermission(area, action)"
                                  [disabled]="isDefaultRole">
                        {{ action | titlecase }}
                      </mat-checkbox>
                    </div>
                  </div>
                </mat-expansion-panel>
              </mat-accordion>
            </div>
            
            <div class="form-actions">
              <button mat-button [routerLink]="['/roles']">Cancel</button>
              <button mat-raised-button color="primary" type="submit" 
                      [disabled]="roleForm.invalid || isDefaultRole">
                {{ isNewRole ? 'Create' : 'Update' }}
              </button>
            </div>
          </form>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .container {
      padding: 20px;
      max-width: 800px;
      margin: 0 auto;
    }
    
    .form-row {
      margin-bottom: 20px;
    }
    
    .full-width {
      width: 100%;
    }
    
    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      margin-top: 20px;
    }
    
    .spinner-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 300px;
    }
    
    .permissions-container {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin-top: 10px;
    }
    
    .permission-checkbox {
      min-width: 120px;
    }
  `]
})
export class RoleDetailComponent implements OnInit {
  roleForm!: FormGroup;
  roleId: string | null = null;
  isNewRole = true;
  isLoading = false;
  isDefaultRole = false;
  
  permissionAreas = [
    'users', 'roles', 'stores', 'employees', 
    'hours', 'payments', 'inventory', 'stock_requests',
    'sales', 'reports'
  ];
  
  permissionActions = ['read', 'write', 'delete', 'approve'];
  selectedPermissions: string[] = [];
  
  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private roleService: RoleService,
    private snackBar: MatSnackBar
  ) { }
  
  ngOnInit(): void {
    this.createForm();
    
    this.roleId = this.route.snapshot.paramMap.get('id');
    
    if (this.roleId && this.roleId !== 'new') {
      this.isNewRole = false;
      this.loadRole(this.roleId);
    }
  }
  
  createForm(): void {
    this.roleForm = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      permissions: [[]]
    });
  }
  
  loadRole(roleId: string): void {
    this.isLoading = true;
    this.roleService.getRole(roleId).subscribe({
      next: (role: any) => {
        this.roleForm.patchValue({
          name: role.name,
          description: role.description,
          permissions: role.permissions
        });
        
        this.selectedPermissions = role.permissions;
        this.isDefaultRole = ['Admin', 'Manager', 'Employee'].includes(role.name);
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error loading role', error);
        this.snackBar.open('Error loading role', 'Close', { duration: 3000 });
        this.isLoading = false;
        this.router.navigate(['/roles']);
      }
    });
  }
  
  hasPermission(area: string, action: string): boolean {
    return this.selectedPermissions.includes(`${area}:${action}`);
  }
  
  togglePermission(area: string, action: string): void {
    const permission = `${area}:${action}`;
    
    if (this.hasPermission(area, action)) {
      this.selectedPermissions = this.selectedPermissions.filter(p => p !== permission);
    } else {
      this.selectedPermissions = [...this.selectedPermissions, permission];
    }
    
    this.roleForm.patchValue({
      permissions: this.selectedPermissions
    });
  }
  
  getSelectedAreaPermissions(area: string): string[] {
    return this.selectedPermissions.filter(p => p.startsWith(`${area}:`));
  }
  
  onSubmit(): void {
    if (this.roleForm.invalid) return;
    
    const roleData = this.roleForm.value;
    roleData.permissions = this.selectedPermissions;
    
    this.isLoading = true;
    
    if (this.isNewRole) {
      this.roleService.createRole(roleData).subscribe({
        next: () => {
          this.snackBar.open('Role created successfully', 'Close', { duration: 3000 });
          this.router.navigate(['/roles']);
        },
        error: (error: { error: { detail: any; }; }) => {
          console.error('Error creating role', error);
          this.snackBar.open(error.error?.detail || 'Error creating role', 'Close', { duration: 3000 });
          this.isLoading = false;
        }
      });
    } else {
      this.roleService.updateRole(this.roleId!, roleData).subscribe({
        next: () => {
          this.snackBar.open('Role updated successfully', 'Close', { duration: 3000 });
          this.router.navigate(['/roles']);
        },
        error: (error: { error: { detail: any; }; }) => {
          console.error('Error updating role', error);
          this.snackBar.open(error.error?.detail || 'Error updating role', 'Close', { duration: 3000 });
          this.isLoading = false;
        }
      });
    }
  }
}