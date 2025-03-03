// src/app/features/user-management/user-list/user-list.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterModule } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Router } from '@angular/router';

import { UserService } from '../../../core/auth/services/user.service';
import { RoleService } from '../../../core/auth/services/role.service';
import { User } from '../../../core/auth/models/user.model';
import { Role } from '../../../core/auth/models/role.model';
import { AuthService } from '../../../core/auth/services/auth.service';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    RouterModule,
    MatSnackBarModule
  ],
  template: `
    <div class="container">
      <mat-card class="users-card">
        <mat-card-header>
          <mat-card-title>User Management</mat-card-title>
          <div class="header-actions">
            <button mat-raised-button color="primary" [routerLink]="['/users/new']" 
                    *ngIf="authService.hasPermission('users:write')">
              <mat-icon>add</mat-icon> Add User
            </button>
          </div>
        </mat-card-header>
        
        <mat-card-content>
          <div class="spinner-container" *ngIf="isLoading">
            <mat-spinner diameter="40"></mat-spinner>
          </div>
          
          <div class="table-container" *ngIf="!isLoading">
            <table mat-table [dataSource]="users" class="mat-elevation-z2 users-table">
              <!-- Name Column -->
              <ng-container matColumnDef="name">
                <th mat-header-cell *matHeaderCellDef>Name</th>
                <td mat-cell *matCellDef="let user">{{user.full_name}}</td>
              </ng-container>
              
              <!-- Email Column -->
              <ng-container matColumnDef="email">
                <th mat-header-cell *matHeaderCellDef>Email</th>
                <td mat-cell *matCellDef="let user">{{user.email}}</td>
              </ng-container>
              
              <!-- Phone Column -->
              <ng-container matColumnDef="phone">
                <th mat-header-cell *matHeaderCellDef>Phone</th>
                <td mat-cell *matCellDef="let user">{{user.phone_number || 'N/A'}}</td>
              </ng-container>
              
              <!-- Role Column -->
              <ng-container matColumnDef="role">
                <th mat-header-cell *matHeaderCellDef>Role</th>
                <td mat-cell *matCellDef="let user">{{getRoleName(user.role_id)}}</td>
              </ng-container>
              
              <!-- Status Column -->
              <ng-container matColumnDef="status">
                <th mat-header-cell *matHeaderCellDef>Status</th>
                <td mat-cell *matCellDef="let user">
                  <span class="status-badge" [ngClass]="{'active': user.is_active, 'inactive': !user.is_active}">
                    {{user.is_active ? 'Active' : 'Inactive'}}
                  </span>
                </td>
              </ng-container>
              
              <!-- Actions Column -->
              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef>Actions</th>
                <td mat-cell *matCellDef="let user">
                  <button mat-icon-button color="primary" [routerLink]="['/users', user._id]" 
                          matTooltip="Edit User" *ngIf="authService.hasPermission('users:write')">
                    <mat-icon>edit</mat-icon>
                  </button>
                  <button mat-icon-button color="warn" (click)="deleteUser(user._id)"
                          matTooltip="Delete User" *ngIf="authService.hasPermission('users:delete')">
                    <mat-icon>delete</mat-icon>
                  </button>
                </td>
              </ng-container>
              
              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
            </table>
            
            <div class="no-data" *ngIf="users.length === 0">
              No users found.
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
    
    .users-card {
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
    
    .users-table {
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
    
    .status-badge {
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 500;
    }
    
    .active {
      background-color: #e6f7ed;
      color: #0d904f;
    }
    
    .inactive {
      background-color: #fdeded;
      color: #d32f2f;
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
  `]
})
export class UserListComponent implements OnInit {
  users: User[] = [];
  roles: Role[] = [];
  isLoading = false;
  displayedColumns: string[] = ['name', 'email', 'phone', 'role', 'status', 'actions'];
  
  constructor(
    private userService: UserService,
    private roleService: RoleService,
    private snackBar: MatSnackBar,
    private router: Router,
    public authService: AuthService
  ) { }
  
  ngOnInit(): void {
    this.loadUsers();
    this.loadRoles();
  }
  
  loadUsers(): void {
    debugger;
    this.isLoading = true;
    this.userService.getUsers().subscribe({
      next: (users) => {
        this.users = users;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading users', error);
        this.snackBar.open('Error loading users', 'Close', { duration: 3000 });
        this.isLoading = false;
      }
    });
  }
  
  loadRoles(): void {
    debugger;
    this.roleService.getRoles().subscribe({
      next: (roles) => {
        this.roles = roles;
        console.log('Loaded roles:', this.roles);
      },
      error: (error) => {
        console.error('Error loading roles', error);
        console.log('Loaded roles:', this.roles);
      }
    });
  }
  
  getRoleName(roleId: string | undefined): string {
    console.log('Finding role for ID:', roleId);
    console.log('Available roles:', this.roles);
    
    if (!roleId) return 'No Role';
    const role = this.roles.find(r => r._id === roleId);
    
    console.log('Found role:', role);
    return role ? role.name : 'Unknown Role';
  }
  
  deleteUser(userId: string): void {
    if (confirm('Are you sure you want to delete this user?')) {
      this.userService.deleteUser(userId).subscribe({
        next: () => {
          this.snackBar.open('User deleted successfully', 'Close', { duration: 3000 });
          this.loadUsers();
        },
        error: (error) => {
          console.error('Error deleting user', error);
          this.snackBar.open('Error deleting user', 'Close', { duration: 3000 });
        }
      });
    }
  }
}