// src/app/features/user-management/user-detail/user-detail.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';

import { UserService } from '../../../core/services/user.service';
import { NotificationService } from '../../../core/services/notification.service';
import { AuthService } from '../../../core/services/auth.service';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { CardContainerComponent } from '../../../shared/components/card-container/card-container.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { User } from '../../../shared/models/user.model';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';


@Component({
  selector: 'app-user-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatDividerModule,
    PageHeaderComponent,
    CardContainerComponent,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="user-detail-container">
      <app-page-header 
        [title]="user?.full_name || 'User Details'" 
        subtitle="User information and details"
        [showBackButton]="true"
        backButtonLink="/users"
        [showAddButton]="false">
        <button 
          *ngIf="canEditUsers"
          mat-flat-button 
          color="primary" 
          [routerLink]="['/users/edit', userId]">
          <mat-icon>edit</mat-icon>
          Edit User
        </button>
        <button 
          *ngIf="canDeleteUsers && !isSelf"
          mat-flat-button 
          color="warn" 
          (click)="confirmDelete()">
          <mat-icon>delete</mat-icon>
          Delete User
        </button>
      </app-page-header>
      
      <div class="user-content" *ngIf="user">
        <app-card-container title="User Information">
          <div class="user-info">
            <div class="info-row">
              <div class="info-label">Name</div>
              <div class="info-value">{{ user.full_name }}</div>
            </div>
            
            <mat-divider></mat-divider>
            
            <div class="info-row">
              <div class="info-label">Email</div>
              <div class="info-value">{{ user.email }}</div>
            </div>
            
            <mat-divider></mat-divider>
            
            <div class="info-row">
              <div class="info-label">Phone</div>
              <div class="info-value">{{ user.phone_number || 'N/A' }}</div>
            </div>
            
            <mat-divider></mat-divider>
            
            <div class="info-row">
              <div class="info-label">Role</div>
              <div class="info-value">{{ user.role_name || 'No Role' }}</div>
            </div>
            
            <mat-divider></mat-divider>
            
            <div class="info-row">
              <div class="info-label">Status</div>
              <div class="info-value">
                <span class="status-chip" [ngClass]="user.is_active ? 'active-chip' : 'inactive-chip'">
                  {{ user.is_active ? 'Active' : 'Inactive' }}
                </span>
              </div>
            </div>
            
            <mat-divider></mat-divider>
            
            <div class="info-row">
              <div class="info-label">Created</div>
              <div class="info-value">{{ user.created_at | date:'medium' }}</div>
            </div>
            
            <mat-divider></mat-divider>
            
            <div class="info-row">
              <div class="info-label">Last Updated</div>
              <div class="info-value">{{ user.updated_at | date:'medium' }}</div>
            </div>
          </div>
        </app-card-container>
        
        <app-card-container title="Permissions" *ngIf="user.permissions && user.permissions.length > 0">
          <div class="permissions-list">
            <div class="permission-chip" *ngFor="let permission of user.permissions">
              {{ formatPermission(permission) }}
            </div>
          </div>
        </app-card-container>
      </div>
      
      <div class="loading-spinner" *ngIf="loading">
        <mat-spinner></mat-spinner>
      </div>
    </div>
  `,
  styles: [`
    .user-detail-container {
      padding: 16px;
    }
    
    .user-content {
      display: flex;
      flex-direction: column;
      gap: 20px;
      margin-top: 16px;
    }
    
    .user-info {
      padding: 8px 0;
    }
    
    .info-row {
      display: flex;
      padding: 16px 0;
    }
    
    .info-label {
      font-weight: 500;
      width: 150px;
      color: #666;
    }
    
    .info-value {
      flex: 1;
    }
    
    .permissions-list {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    
    .permission-chip {
      background-color: #e3f2fd;
      color: #1565c0;
      border-radius: 16px;
      padding: 6px 12px;
      font-size: 13px;
      font-weight: 500;
    }
    
    .status-chip {
      border-radius: 16px;
      padding: 4px 8px;
      font-size: 12px;
      font-weight: 500;
      display: inline-block;
    }
    
    .active-chip {
      background-color: #e8f5e9;
      color: #2e7d32;
    }
    
    .inactive-chip {
      background-color: #ffebee;
      color: #c62828;
    }
    
    .loading-spinner {
      display: flex;
      justify-content: center;
      margin-top: 48px;
    }
  `]
})
export class UserDetailComponent implements OnInit {
  userId: string = '';
  user: User | null = null;
  loading = false;
  
  get canEditUsers(): boolean {
    return this.authService.hasPermission('users:write');
  }
  
  get canDeleteUsers(): boolean {
    return this.authService.hasPermission('users:delete');
  }
  
  get isSelf(): boolean {
    return this.user?._id === this.authService.currentUserValue?._id;
  }
  
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private userService: UserService,
    private authService: AuthService,
    private notificationService: NotificationService,
    private dialog: MatDialog
  ) {}
  
  ngOnInit(): void {
    this.userId = this.route.snapshot.paramMap.get('id') || '';
    if (this.userId) {
      this.loadUser();
    } else {
      this.notificationService.error('User ID is required');
      this.router.navigate(['/users']);
    }
  }
  
  loadUser(): void {
    this.loading = true;
    
    this.userService.getUser(this.userId).subscribe({
      next: (user) => {
        this.user = user;
        this.loading = false;
      },
      error: (error) => {
        this.notificationService.error('Failed to load user details');
        this.loading = false;
        this.router.navigate(['/users']);
      }
    });
  }
  
  confirmDelete(): void {
    if (this.isSelf) {
      this.notificationService.error("You cannot delete your own account");
      return;
    }
    
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Delete User',
        message: `Are you sure you want to delete user ${this.user?.full_name}?`,
        confirmText: 'Delete',
        cancelText: 'Cancel',
        type: 'warning'
      }
    });
    
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.deleteUser();
      }
    });
  }
  
  deleteUser(): void {
    if (!this.user) return;
    
    this.userService.deleteUser(this.user._id).subscribe({
      next: (result) => {
        if (result) {
          this.notificationService.success(`User ${this.user?.full_name} deleted successfully`);
          this.router.navigate(['/users']);
        } else {
          this.notificationService.error('Failed to delete user');
        }
      },
      error: (error) => {
        this.notificationService.error('Failed to delete user');
      }
    });
  }
  
  formatPermission(permission: string): string {
    const [area, action] = permission.split(':');
    return `${this.capitalizeFirstLetter(area)} - ${this.formatAction(action)}`;
  }
  
  formatAction(action: string): string {
    switch (action) {
      case 'read':
        return 'View';
      case 'write':
        return 'Create/Edit';
      case 'delete':
        return 'Delete';
      case 'approve':
        return 'Approve';
      default:
        return this.capitalizeFirstLetter(action);
    }
  }
  
  capitalizeFirstLetter(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}