// src/app/features/users/user-management/user-detail/user-detail.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { UserService } from '../../../../core/services/user.service';
import { PermissionService } from '../../../../core/auth/permission.service';
import { User } from '../../../../shared/models/user.model';
import { HasPermissionDirective } from '../../../../shared/directives/has-permission.directive';

@Component({
  selector: 'app-user-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, HasPermissionDirective],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h1 class="page-title">User Details</h1>
        <div class="flex flex-col sm:flex-row gap-4">
          <button routerLink="/users/management" class="btn btn-outline flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Users
          </button>
          
          <button 
            *appHasPermission="'users:write'"
            [routerLink]="['/users/management', userId, 'edit']" 
            class="btn btn-primary flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit User
          </button>
        </div>
      </div>

      <!-- Loading state -->
      <div *ngIf="loading" class="flex justify-center items-center p-8">
        <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500"></div>
      </div>
      
      <!-- Error state -->
      <div *ngIf="error" class="alert alert-danger mb-6">
        {{ error }}
      </div>
      
      <!-- User details -->
      <div *ngIf="user && !loading" class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- User profile card -->
        <div class="card col-span-1">
          <div class="flex flex-col items-center justify-center text-center">
            <!-- User avatar (initials) -->
            <div class="h-24 w-24 rounded-full bg-slate-600 dark:bg-slate-700 flex items-center justify-center text-white text-2xl font-bold mb-4">
              {{ getUserInitials() }}
            </div>
            
            <!-- User name and email -->
            <h2 class="text-xl font-bold">{{ user.full_name }}</h2>
            <p class="text-sm text-[var(--text-secondary)]">{{ user.email }}</p>
            
            <!-- Role badge -->
            <div [class]="getRoleBadgeClass(user.role_id)" class="mt-2">{{ getRoleName(user.role_id) }}</div>
            
            <!-- Status indicator -->
            <div class="mt-2 flex items-center justify-center">
              <span 
                class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                [ngClass]="user.is_active ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'"
              >
                <span class="h-2 w-2 rounded-full mr-1.5" [ngClass]="user.is_active ? 'bg-green-500' : 'bg-red-500'"></span>
                {{ user.is_active ? 'Active' : 'Inactive' }}
              </span>
            </div>
            
            <!-- User details -->
            <div class="w-full mt-6 pt-6 border-t border-[var(--border-color)]">
              <div class="grid grid-cols-1 gap-4">
                <div class="flex flex-col">
                  <span class="text-xs text-[var(--text-secondary)]">Phone Number</span>
                  <span>{{ user.phone_number || 'Not provided' }}</span>
                </div>
                <div class="flex flex-col">
                  <span class="text-xs text-[var(--text-secondary)]">Member Since</span>
                  <span>{{ user.created_at | date:'mediumDate' }}</span>
                </div>
                <div class="flex flex-col">
                  <span class="text-xs text-[var(--text-secondary)]">Last Updated</span>
                  <span>{{ user.updated_at | date:'mediumDate' }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- User information and management -->
        <div class="card col-span-1 lg:col-span-2">
          <h2 class="text-xl font-bold mb-6">User Information</h2>
          
          <div class="space-y-6">
            <!-- Account Information -->
            <div class="border border-[var(--border-color)] rounded-lg overflow-hidden">
              <div class="px-4 py-3 bg-[var(--bg-main)] border-b border-[var(--border-color)]">
                <h3 class="text-md font-medium">Account Information</h3>
              </div>
              <div class="p-4 space-y-4">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label class="text-xs text-[var(--text-secondary)]">Full Name</label>
                    <div class="mt-1 p-2 bg-[var(--bg-main)] rounded">{{ user.full_name }}</div>
                  </div>
                  <div>
                    <label class="text-xs text-[var(--text-secondary)]">Email</label>
                    <div class="mt-1 p-2 bg-[var(--bg-main)] rounded">{{ user.email }}</div>
                  </div>
                  <div>
                    <label class="text-xs text-[var(--text-secondary)]">Phone</label>
                    <div class="mt-1 p-2 bg-[var(--bg-main)] rounded">{{ user.phone_number || 'Not provided' }}</div>
                  </div>
                  <div>
                    <label class="text-xs text-[var(--text-secondary)]">Role</label>
                    <div class="mt-1 p-2 bg-[var(--bg-main)] rounded">{{ getRoleName(user.role_id) }}</div>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Role Management (for admins only) -->
            <div *appHasPermission="'users:write'" class="border border-[var(--border-color)] rounded-lg overflow-hidden">
              <div class="px-4 py-3 bg-[var(--bg-main)] border-b border-[var(--border-color)]">
                <h3 class="text-md font-medium">Role Management</h3>
              </div>
              <div class="p-4">
                <p class="text-sm mb-4">Assign a different role to this user to change their permissions.</p>
                
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button 
                    (click)="assignRole('67c9fb4d9db05f47c32b6b22')"
                    [class.bg-purple-100]="user.role_id === '67c9fb4d9db05f47c32b6b22'"
                    [class.dark:bg-purple-900]="user.role_id === '67c9fb4d9db05f47c32b6b22'"
                    [class.dark:text-purple-200]="user.role_id === '67c9fb4d9db05f47c32b6b22'"
                    [class.text-purple-800]="user.role_id === '67c9fb4d9db05f47c32b6b22'"
                    class="p-3 border border-[var(--border-color)] rounded-md text-center hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  >
                    <div class="text-lg font-semibold">Admin</div>
                    <p class="text-xs text-[var(--text-secondary)]">Full system access</p>
                  </button>
                  
                  <button 
                    (click)="assignRole('67c9fb4d9db05f47c32b6b23')"
                    [class.bg-blue-100]="user.role_id === '67c9fb4d9db05f47c32b6b23'"
                    [class.dark:bg-blue-900]="user.role_id === '67c9fb4d9db05f47c32b6b23'"
                    [class.dark:text-blue-200]="user.role_id === '67c9fb4d9db05f47c32b6b23'"
                    [class.text-blue-800]="user.role_id === '67c9fb4d9db05f47c32b6b23'"
                    class="p-3 border border-[var(--border-color)] rounded-md text-center hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  >
                    <div class="text-lg font-semibold">Manager</div>
                    <p class="text-xs text-[var(--text-secondary)]">Store management access</p>
                  </button>
                  
                  <button 
                    (click)="assignRole('67c9fb4d9db05f47c32b6b24')"
                    [class.bg-green-100]="user.role_id === '67c9fb4d9db05f47c32b6b24'"
                    [class.dark:bg-green-900]="user.role_id === '67c9fb4d9db05f47c32b6b24'"
                    [class.dark:text-green-200]="user.role_id === '67c9fb4d9db05f47c32b6b24'"
                    [class.text-green-800]="user.role_id === '67c9fb4d9db05f47c32b6b24'"
                    class="p-3 border border-[var(--border-color)] rounded-md text-center hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  >
                    <div class="text-lg font-semibold">Employee</div>
                    <p class="text-xs text-[var(--text-secondary)]">Basic access</p>
                  </button>
                </div>
                
                <div *ngIf="roleUpdateMessage" class="mt-4" [ngClass]="{'alert-success': !roleUpdateError, 'alert-danger': roleUpdateError}" class="alert">
                  {{ roleUpdateMessage }}
                </div>
              </div>
            </div>
            
            <!-- Account Status (for admins only) -->
            <div *appHasPermission="'users:write'" class="border border-[var(--border-color)] rounded-lg overflow-hidden">
              <div class="px-4 py-3 bg-[var(--bg-main)] border-b border-[var(--border-color)]">
                <h3 class="text-md font-medium">Account Status</h3>
              </div>
              <div class="p-4">
                <div class="flex items-center justify-between">
                  <div>
                    <p class="font-medium">
                      {{ user.is_active ? 'This account is active' : 'This account is inactive' }}
                    </p>
                    <p class="text-sm text-[var(--text-secondary)]">
                      {{ user.is_active ? 'User can login and access the system.' : 'User cannot login or access the system.' }}
                    </p>
                  </div>
                  <button 
                    (click)="toggleUserStatus()"
                    [class]="user.is_active ? 'btn btn-danger' : 'btn btn-success'"
                  >
                    {{ user.is_active ? 'Deactivate Account' : 'Activate Account' }}
                  </button>
                </div>
                
                <div *ngIf="statusUpdateMessage" class="mt-4" [ngClass]="{'alert-success': !statusUpdateError, 'alert-danger': statusUpdateError}" class="alert">
                  {{ statusUpdateMessage }}
                </div>
              </div>
            </div>
            
            <!-- Danger Zone (for admins only) -->
            <div *appHasPermission="'users:delete'" class="border border-red-300 dark:border-red-700 rounded-lg overflow-hidden">
              <div class="px-4 py-3 bg-red-50 dark:bg-red-900/30 border-b border-red-300 dark:border-red-700">
                <h3 class="text-md font-medium text-red-800 dark:text-red-300">Danger Zone</h3>
              </div>
              <div class="p-4">
                <div class="flex items-center justify-between">
                  <div>
                    <p class="font-medium">Delete this user</p>
                    <p class="text-sm text-[var(--text-secondary)]">
                      Once deleted, all data will be permanently removed and cannot be recovered.
                    </p>
                  </div>
                  <button 
                    (click)="deleteUser()"
                    class="btn btn-danger"
                  >
                    Delete User
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class UserDetailComponent implements OnInit {
  userId: string = '';
  user: User | null = null;
  loading = true;
  error = '';
  
  // Role management
  roleUpdateMessage = '';
  roleUpdateError = false;
  
  // Status management
  statusUpdateMessage = '';
  statusUpdateError = false;
  
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private userService: UserService,
    private permissionService: PermissionService
  ) {}
  
  ngOnInit(): void {
    this.userId = this.route.snapshot.paramMap.get('id') || '';
    this.loadUser();
  }
  
  loadUser(): void {
    this.loading = true;
    this.error = '';
    
    if (!this.userId) {
      this.error = 'User ID is required';
      this.loading = false;
      return;
    }
    
    this.userService.getUserById(this.userId).subscribe({
      next: (user) => {
        this.user = user;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load user. Please try again later.';
        this.loading = false;
        console.error('Error loading user:', err);
      }
    });
  }
  
  getUserInitials(): string {
    if (!this.user?.full_name) return 'U';
    
    const names = this.user.full_name.split(' ');
    if (names.length === 1) return names[0].charAt(0).toUpperCase();
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
  }
  
  getRoleName(roleId?: string): string {
    if (!roleId) return 'No Role';
    
    // Map role IDs to names
    if (roleId === '67c9fb4d9db05f47c32b6b22') return 'Admin';
    if (roleId === '67c9fb4d9db05f47c32b6b23') return 'Manager';
    if (roleId === '67c9fb4d9db05f47c32b6b24') return 'Employee';
    
    return 'Unknown Role';
  }
  
  getRoleBadgeClass(roleId?: string): string {
    const baseClass = 'badge px-3 py-1';
    
    if (!roleId) return `${baseClass} bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200`;
    
    // Map role IDs to badge classes
    if (roleId === '67c9fb4d9db05f47c32b6b22') 
      return `${baseClass} bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200`;
    if (roleId === '67c9fb4d9db05f47c32b6b23') 
      return `${baseClass} bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200`;
    if (roleId === '67c9fb4d9db05f47c32b6b24') 
      return `${baseClass} bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200`;
    
    return `${baseClass} bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200`;
  }
  
  assignRole(roleId: string): void {
    if (!this.user) {
      return;
    }
    
    // Don't reassign the same role
    if (this.user.role_id === roleId) {
      this.roleUpdateMessage = `User already has the role of ${this.getRoleName(roleId)}.`;
      this.roleUpdateError = false;
      setTimeout(() => {
        this.roleUpdateMessage = '';
      }, 3000);
      return;
    }
    
    this.roleUpdateMessage = '';
    this.roleUpdateError = false;
    
    this.userService.assignRole(this.userId, roleId).subscribe({
      next: (updatedUser) => {
        this.user = updatedUser;
        this.roleUpdateMessage = `User role updated to ${this.getRoleName(roleId)}.`;
        this.roleUpdateError = false;
        setTimeout(() => {
          this.roleUpdateMessage = '';
        }, 3000);
      },
      error: (err) => {
        this.roleUpdateMessage = 'Failed to update user role. Please try again later.';
        this.roleUpdateError = true;
        console.error('Error updating user role:', err);
      }
    });
  }
  
  toggleUserStatus(): void {
    if (!this.user) {
      return;
    }
    
    const newStatus = !this.user.is_active;
    const actionText = newStatus ? 'activate' : 'deactivate';
    
    if (!confirm(`Are you sure you want to ${actionText} this user account?`)) {
      return;
    }
    
    this.statusUpdateMessage = '';
    this.statusUpdateError = false;
    
    this.userService.updateUser(this.userId, { is_active: newStatus }).subscribe({
      next: (updatedUser) => {
        this.user = updatedUser;
        this.statusUpdateMessage = `User account ${newStatus ? 'activated' : 'deactivated'} successfully.`;
        this.statusUpdateError = false;
        setTimeout(() => {
          this.statusUpdateMessage = '';
        }, 3000);
      },
      error: (err) => {
        this.statusUpdateMessage = `Failed to ${actionText} user account. Please try again later.`;
        this.statusUpdateError = true;
        console.error('Error updating user status:', err);
      }
    });
  }
  
  deleteUser(): void {
    if (!this.user) {
      return;
    }
    
    if (!confirm(`Are you sure you want to delete ${this.user.full_name}? This action cannot be undone.`)) {
      return;
    }
    
    this.userService.deleteUser(this.userId).subscribe({
      next: (success) => {
        if (success) {
          this.router.navigate(['/users/management']);
        } else {
          this.error = 'Failed to delete user.';
        }
      },
      error: (err) => {
        this.error = 'Failed to delete user. Please try again later.';
        console.error('Error deleting user:', err);
      }
    });
  }
}