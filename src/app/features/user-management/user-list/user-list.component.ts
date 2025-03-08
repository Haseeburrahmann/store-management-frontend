// src/app/features/user-management/user-list/user-list.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { MatChipsModule } from '@angular/material/chips';

import { UserService } from '../../../core/services/user.service';
import { NotificationService } from '../../../core/services/notification.service';
import { AuthService } from '../../../core/services/auth.service';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { DataTableComponent } from '../../../shared/components/data-table/data-table.component';
import { CardContainerComponent } from '../../../shared/components/card-container/card-container.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { User } from '../../../shared/models/user.model';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    PageHeaderComponent,
    DataTableComponent,
    CardContainerComponent
  ],
  template: `
    <div class="user-list-container">
      <app-page-header 
        title="User Management" 
        subtitle="View and manage system users"
        [showAddButton]="canCreateUsers"
        addButtonText="Add User"
        addButtonLink="create">
      </app-page-header>
      
      <app-card-container>
        <app-data-table
          [columns]="columns"
          [data]="users"
          [showViewAction]="true"
          [showEditAction]="canEditUsers"
          [showDeleteAction]="canDeleteUsers"
          [emptyMessage]="'No users found'"
          (viewItem)="viewUser($event)"
          (editItem)="editUser($event)"
          (deleteItem)="confirmDelete($event)">
        </app-data-table>
      </app-card-container>
    </div>
  `,
  styles: [`
    .user-list-container {
      padding: 16px;
    }
    
    :host ::ng-deep .status-chip {
      border-radius: 16px;
      padding: 4px 8px;
      font-size: 12px;
      font-weight: 500;
    }
    
    :host ::ng-deep .active-chip {
      background-color: #e8f5e9;
      color: #2e7d32;
    }
    
    :host ::ng-deep .inactive-chip {
      background-color: #ffebee;
      color: #c62828;
    }
  `]
})
export class UserListComponent implements OnInit {
  users: User[] = [];
  loading = false;
  
  columns = [
    { name: 'full_name', label: 'Name', sortable: true },
    { name: 'email', label: 'Email', sortable: true },
    { name: 'phone_number', label: 'Phone' },
    { name: 'role_name', label: 'Role' },
    { 
      name: 'is_active', 
      label: 'Status', 
      type: 'status' as 'status', // Fix the type here
      // Replace the format function with something simpler that returns a string
      format: 'status' // The DataTable component likely expects a string format
    },
    { name: 'actions', label: 'Actions', type: 'actions' as 'actions' }
  ];
  
  get canCreateUsers(): boolean {
    return this.authService.hasPermission('users:write');
  }
  
  get canEditUsers(): boolean {
    return this.authService.hasPermission('users:write');
  }
  
  get canDeleteUsers(): boolean {
    return this.authService.hasPermission('users:delete');
  }
  
  constructor(
    private userService: UserService,
    private authService: AuthService,
    private notificationService: NotificationService,
    private dialog: MatDialog,
    private router: Router
  ) {}
  
  ngOnInit(): void {
    this.loadUsers();
  }
  
  loadUsers(refresh = false): void {
    this.loading = true;
    
    this.userService.getUsers({}, refresh).subscribe({
      next: (users) => {
        this.users = users.map(user => ({
          ...user,
          role_name: user.role_name || 'No Role',
          status: user.is_active ? 'active' : 'inactive'
        }));
        this.loading = false;
      },
      error: (error) => {
        this.notificationService.error('Failed to load users');
        this.loading = false;
      }
    });
  }
  
  viewUser(user: User): void {
    this.router.navigate(['/users', user._id]);
  }
  
  editUser(user: User): void {
    this.router.navigate(['/users/edit', user._id]);
  }
  
  confirmDelete(user: User): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Delete User',
        message: `Are you sure you want to delete user ${user.full_name}?`,
        confirmText: 'Delete',
        cancelText: 'Cancel',
        type: 'warning'
      }
    });
    
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.deleteUser(user);
      }
    });
  }
  
  deleteUser(user: User): void {
    this.userService.deleteUser(user._id).subscribe({
      next: (result) => {
        if (result) {
          this.notificationService.success(`User ${user.full_name} deleted successfully`);
          this.loadUsers(true);
        } else {
          this.notificationService.error('Failed to delete user');
        }
      },
      error: (error) => {
        this.notificationService.error('Failed to delete user');
      }
    });
  }
}