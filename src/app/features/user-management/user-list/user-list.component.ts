// src/app/features/user-management/user-list/user-list.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterModule, NavigationEnd, Router } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { filter, Subscription } from 'rxjs';

import { UserService } from '../../../core/services/user.service';
import { RoleService } from '../../../core/services/role.service';
import { AuthService } from '../../../core/services/auth.service';
import { User, UserWithPermissions } from '../../../core/auth/models/user.model';
import { Role } from '../../../shared/models/role.model';

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
            <button 
              mat-raised-button 
              color="primary" 
              [routerLink]="['/users/new']" 
              *ngIf="canCreateUsers"
            >
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
                <td mat-cell *matCellDef="let user">
                  <span *ngIf="roles.length === 0" class="loading-info">Loading roles...</span>
                  <span *ngIf="roles.length > 0">
                    <!-- Check if role is an object with a name property -->
                    <span *ngIf="user.role && user.role.name">
                      {{user.role.name}}
                    </span>
                    <!-- Fallback to finding role by ID -->
                    <span *ngIf="!user.role && user.role_id">
                      {{getRoleName(user.role_id)}}
                    </span>
                    <!-- No role case -->
                    <span *ngIf="!user.role && !user.role_id">
                      No Role
                    </span>
                  </span>
                </td>
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
                  <button 
                    mat-icon-button 
                    color="primary" 
                    [routerLink]="['/users', user._id]" 
                    matTooltip="Edit User"
                    *ngIf="canEditUsers"
                  >
                    <mat-icon>edit</mat-icon>
                  </button>
                  <button 
                    mat-icon-button 
                    color="warn" 
                    (click)="deleteUser(user._id)" 
                    matTooltip="Delete User"
                    *ngIf="canDeleteUsers"
                  >
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
    
    .loading-info {
      font-style: italic;
      color: #666;
    }
  `]
})
export class UserListComponent implements OnInit, OnDestroy {
  users: User[] = [];
  roles: Role[] = [];
  isLoading = false;
  displayedColumns: string[] = ['name', 'email', 'phone', 'role', 'status', 'actions'];
  
  // Permission flags
  canCreateUsers = false;
  canEditUsers = false;
  canDeleteUsers = false;
  
  private routerSubscription?: Subscription;
  private currentUserSubscription?: Subscription;
  
  constructor(
    private userService: UserService,
    private roleService: RoleService,
    private snackBar: MatSnackBar,
    private router: Router,
    private authService: AuthService
  ) { }
  
  ngOnInit(): void {
    this.checkPermissions();
    this.loadUsersAndRoles();
    
    // Subscribe to router events to reload data when navigating to this component
    this.routerSubscription = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.loadUsersAndRoles();
    });
  }
  
  ngOnDestroy(): void {
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
    
    if (this.currentUserSubscription) {
      this.currentUserSubscription.unsubscribe();
    }
  }
  
  checkPermissions(): void {
    this.currentUserSubscription = this.authService.user$.subscribe(user => {
      if (user) {
        this.canCreateUsers = this.authService.hasPermission('users', 'write');
        this.canEditUsers = this.authService.hasPermission('users', 'write');
        this.canDeleteUsers = this.authService.hasPermission('users', 'delete');
      }
    });
  }
  
  loadUsersAndRoles(): void {
    // Load roles first
    this.isLoading = true;
    this.roleService.getRoles().subscribe({
      next: (roles) => {
        this.roles = roles;
        
        // Then load users after roles are loaded
        this.loadUsers();
      },
      error: (error) => {
        console.error('Error loading roles', error);
        this.snackBar.open('Failed to load roles: ' + (error.message || 'Unknown error'), 'Close', { duration: 3000 });
        // Still try to load users even if roles fail
        this.loadUsers();
      }
    });
  }
  
  loadUsers(): void {
    this.userService.getUsers().subscribe({
      next: (users) => {
        this.users = users;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading users', error);
        this.snackBar.open('Failed to load users: ' + (error.message || 'Unknown error'), 'Close', { duration: 3000 });
        this.isLoading = false;
      }
    });
  }
  
  getRoleName(roleId: string | undefined): string {
    if (!roleId) return 'No Role';
    
    const role = this.roles.find(r => r._id === roleId);
    
    // Check if the data might be formatted differently
    if (!role) {
      // Try with different id formats
      const roleByStringId = this.roles.find(r => String(r._id) === String(roleId));
      if (roleByStringId) {
        return roleByStringId.name;
      }
    }
    
    return role ? role.name : 'Unknown Role';
  }
  
  deleteUser(userId: string): void {
    if (confirm('Are you sure you want to delete this user?')) {
      this.userService.deleteUser(userId).subscribe({
        next: () => {
          this.snackBar.open('User deleted successfully', 'Close', { duration: 3000 });
          this.loadUsers(); // Reload the list
        },
        error: (error) => {
          console.error('Error deleting user', error);
          this.snackBar.open('Failed to delete user: ' + (error.message || 'Unknown error'), 'Close', { duration: 3000 });
        }
      });
    }
  }
}