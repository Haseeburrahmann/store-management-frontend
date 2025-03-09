// src/app/shared/components/auth-test/auth-test.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/auth/auth.service';
import { PermissionService } from '../../../core/auth/permission.service';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-auth-test',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 mb-6">
      <h2 class="text-xl font-bold mb-4 text-slate-900 dark:text-white">Authentication Test</h2>
      
      <div class="mb-4">
        <h3 class="text-lg font-semibold mb-2 text-slate-800 dark:text-slate-200">Authentication Status</h3>
        <div class="p-3 bg-slate-100 dark:bg-slate-700 rounded">
          <p class="mb-1">
            <span class="font-medium">Is Authenticated:</span> 
            <span [class]="isAuthenticated ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'">
              {{ isAuthenticated ? 'Yes' : 'No' }}
            </span>
          </p>
          <p class="mb-1"><span class="font-medium">Token:</span> {{ hasToken ? 'Present' : 'Not present' }}</p>
          <p><span class="font-medium">Role:</span> {{ userRole }}</p>
        </div>
      </div>
      
      <div class="mb-4">
        <h3 class="text-lg font-semibold mb-2 text-slate-800 dark:text-slate-200">User Information</h3>
        <div *ngIf="user; else noUser" class="p-3 bg-slate-100 dark:bg-slate-700 rounded">
          <p class="mb-1"><span class="font-medium">ID:</span> {{ user._id }}</p>
          <p class="mb-1"><span class="font-medium">Name:</span> {{ user.full_name }}</p>
          <p class="mb-1"><span class="font-medium">Email:</span> {{ user.email }}</p>
          <p><span class="font-medium">Role ID:</span> {{ user.role_id || 'No role assigned' }}</p>
        </div>
        <ng-template #noUser>
          <div class="p-3 bg-slate-100 dark:bg-slate-700 rounded">
            <p class="text-red-600 dark:text-red-400">No user data available</p>
          </div>
        </ng-template>
      </div>
      
      <div>
        <h3 class="text-lg font-semibold mb-2 text-slate-800 dark:text-slate-200">Permissions</h3>
        <div class="p-3 bg-slate-100 dark:bg-slate-700 rounded">
          <div *ngIf="permissions.length > 0; else noPermissions">
            <p class="mb-2 font-medium">Available Permissions:</p>
            <ul class="list-disc pl-5">
              <li *ngFor="let permission of permissions" class="mb-1 text-sm">
                {{ permission }}
              </li>
            </ul>
          </div>
          <ng-template #noPermissions>
            <p class="text-amber-600 dark:text-amber-400">No permissions loaded</p>
          </ng-template>
        </div>
      </div>
      
      <div class="mt-4">
        <button 
          (click)="refreshData()" 
          class="px-4 py-2 bg-slate-600 text-white rounded hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600"
        >
          Refresh Data
        </button>
        <button 
          (click)="logout()" 
          class="ml-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Logout
        </button>
      </div>
    </div>
  `
})
export class AuthTestComponent implements OnInit {
  isAuthenticated = false;
  hasToken = false;
  userRole = 'Unknown';
  user: User | null = null;
  permissions: string[] = [];
  
  constructor(
    private authService: AuthService,
    private permissionService: PermissionService
  ) {}
  
  ngOnInit(): void {
    this.refreshData();
    
    // Subscribe to permission changes
    this.permissionService.userPermissions$.subscribe(permissions => {
      console.log('Auth Test: Permissions updated', permissions);
      this.permissions = permissions;
    });
    
    // Subscribe to user changes
    this.authService.currentUser$.subscribe(user => {
      console.log('Auth Test: User updated', user);
      this.user = user;
      this.refreshData();
    });
  }
  
  refreshData(): void {
    this.isAuthenticated = this.authService.isAuthenticated;
    this.hasToken = !!localStorage.getItem('token');
    this.user = this.authService.currentUser;
    this.userRole = this.permissionService.getRoleIdentifier();
    this.permissions = this.permissionService.userPermissionsSubject.value;
  }
  
  logout(): void {
    this.authService.logout();
  }
}