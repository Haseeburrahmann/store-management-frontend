// src/app/features/role-management/role-list/role-list.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { RouterModule } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

import { RoleService } from '../../../core/services/role.service';
import { Role } from '../../../shared/models/role.model';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-role-list',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatChipsModule,
    RouterModule,
    MatSnackBarModule
  ],
  template: `
    <div class="container">
      <mat-card class="roles-card">
        <mat-card-header>
          <mat-card-title>Role Management</mat-card-title>
          <div class="header-actions">
            <button 
              mat-raised-button 
              color="primary" 
              [routerLink]="['/roles/new']" 
              *ngIf="canCreateRoles"
            >
              <mat-icon>add</mat-icon> Add Role
            </button>
          </div>
        </mat-card-header>
        
        <mat-card-content>
          <div class="spinner-container" *ngIf="isLoading">
            <mat-spinner diameter="40"></mat-spinner>
          </div>
          
          <div class="table-container" *ngIf="!isLoading">
            <table mat-table [dataSource]="roles" class="mat-elevation-z2 roles-table">
              <!-- Name Column -->
              <ng-container matColumnDef="name">
                <th mat-header-cell *matHeaderCellDef>Name</th>
                <td mat-cell *matCellDef="let role">{{role.name}}</td>
              </ng-container>
              
              <!-- Description Column -->
              <ng-container matColumnDef="description">
                <th mat-header-cell *matHeaderCellDef>Description</th>
                <td mat-cell *matCellDef="let role">{{role.description || 'N/A'}}</td>
              </ng-container>
              
              <!-- Permissions Column -->
              <ng-container matColumnDef="permissions">
                <th mat-header-cell *matHeaderCellDef>Permissions</th>
                <td mat-cell *matCellDef="let role" class="permissions-cell">
                  <div class="permissions-container">
                    <mat-chip-set>
                      <mat-chip 
                        *ngFor="let permission of getDisplayPermissions(role.permissions)" 
                        [matTooltip]="role.permissions.length > 3 ? getFormattedPermissions(role.permissions) : ''"
                      >
                        {{formatPermission(permission)}}
                      </mat-chip>
                      <span *ngIf="role.permissions.length > 3">
                        +{{role.permissions.length - 3}} more
                      </span>
                    </mat-chip-set>
                  </div>
                </td>
              </ng-container>
              
              <!-- Actions Column -->
              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef>Actions</th>
                <td mat-cell *matCellDef="let role">
                  <button 
                    mat-icon-button 
                    color="primary" 
                    [routerLink]="['/roles', role._id]" 
                    matTooltip="Edit Role" 
                    *ngIf="canEditRoles"
                  >
                    <mat-icon>edit</mat-icon>
                  </button>
                  <button 
                    mat-icon-button 
                    color="warn" 
                    (click)="deleteRole(role._id)"
                    matTooltip="Delete Role" 
                    *ngIf="canDeleteRoles && !isDefaultRole(role.name)"
                  >
                    <mat-icon>delete</mat-icon>
                  </button>
                </td>
              </ng-container>
              
              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
            </table>
            
            <div class="no-data" *ngIf="roles.length === 0">
              No roles found.
            </div>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .container {
      padding: 20px;
    }
    
    .roles-card {
      margin-bottom: 20px;
    }
    
    mat-card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }
    
    .header-actions {
      margin-left: auto;
    }
    
    .roles-table {
      width: 100%;
    }
    
    .spinner-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 200px;
    }
    
    .table-container {
      overflow-x: auto;
    }
    
    .permissions-cell {
      max-width: 300px;
    }
    
    .permissions-container {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
    }
    
    .no-data {
      padding: 20px;
      text-align: center;
      color: #666;
    }

    .mat-column-actions {
      width: 100px;
      text-align: right;
    }
    
    .error-message {
      color: #f44336;
      margin-top: 10px;
      margin-bottom: 10px;
      font-size: 14px;
    }
  `]
})
export class RoleListComponent implements OnInit, OnDestroy {
  roles: Role[] = [];
  isLoading = false;
  displayedColumns: string[] = ['name', 'description', 'permissions', 'actions'];
  error = '';
  
  // Permission flags
  canCreateRoles = false;
  canEditRoles = false;
  canDeleteRoles = false;
  
  private userSubscription?: Subscription;
  
  constructor(
    private roleService: RoleService,
    private snackBar: MatSnackBar,
    private router: Router,
    private authService: AuthService
  ) { }
  
  ngOnInit(): void {
    this.checkPermissions();
    this.loadRoles();
  }
  
  ngOnDestroy(): void {
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
  }
  
  checkPermissions(): void {
    this.userSubscription = this.authService.user$.subscribe(user => {
      if (user) {
        this.canCreateRoles = this.authService.hasPermission('roles', 'write');
        this.canEditRoles = this.authService.hasPermission('roles', 'write');
        this.canDeleteRoles = this.authService.hasPermission('roles', 'delete');
      }
    });
  }
  
  loadRoles(): void {
    this.isLoading = true;
    this.error = '';
    
    this.roleService.getRoles().subscribe({
      next: (roles) => {
        this.roles = roles;
        this.isLoading = false;
      },
      error: (error) => {
        this.isLoading = false;
        this.error = error.message || 'Error loading roles';
        console.error('Error loading roles', error);
        this.snackBar.open('Error loading roles: ' + this.error, 'Close', { duration: 3000 });
      }
    });
  }
  
  getDisplayPermissions(permissions: string[]): string[] {
    return permissions.slice(0, 3);
  }
  
  getFormattedPermissions(permissions: string[]): string {
    return permissions.map(p => this.formatPermission(p)).join(', ');
  }
  
  formatPermission(permission: string): string {
    // Convert from enum format if needed
    if (permission.includes('PermissionArea.')) {
      const match = permission.match(/PermissionArea\.(\w+):PermissionAction\.(\w+)/);
      if (match && match.length === 3) {
        const [_, area, action] = match;
        return `${area.toLowerCase()}:${action.toLowerCase()}`;
      }
    }
    return permission;
  }
  
  isDefaultRole(roleName: string): boolean {
    return ['Admin', 'Manager', 'Employee'].includes(roleName);
  }
  
  deleteRole(roleId: string): void {
    if (confirm('Are you sure you want to delete this role?')) {
      this.roleService.deleteRole(roleId).subscribe({
        next: () => {
          this.snackBar.open('Role deleted successfully', 'Close', { duration: 3000 });
          this.loadRoles();
        },
        error: (error) => {
          this.error = error.message || 'Error deleting role';
          console.error('Error deleting role', error);
          this.snackBar.open('Error deleting role: ' + this.error, 'Close', { duration: 3000 });
        }
      });
    }
  }
}