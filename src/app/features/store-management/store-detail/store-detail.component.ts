// src/app/features/store-management/store-detail/store-detail.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule } from '@angular/forms';
import { StoreService } from '../../../core/auth/services/store.service';
import { UserService } from '../../../core/auth/services/user.service';
import { Store } from '../../../shared/models/store.model';
import { RoleService } from '../../../core/auth/services/role.service';

@Component({
  selector: 'app-store-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatDividerModule,
    MatSelectModule,
    FormsModule
  ],
  templateUrl: './store-detail.component.html',
  styleUrls: ['./store-detail.component.scss']
})
export class StoreDetailComponent implements OnInit {
  store: Store | null = null;
  isLoading = true;
  managers: any[] = [];
  selectedManagerId: string = '';
  isAssigningManager = false;

  constructor(
    private storeService: StoreService,
    private userService: UserService,
    private roleService : RoleService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadStore();
    this.loadManagers();
  }

  loadStore(): void {
    const storeId = this.route.snapshot.paramMap.get('id');
    if (!storeId) {
      this.router.navigate(['/stores']);
      return;
    }

    this.storeService.getStore(storeId).subscribe({
      next: (store:any) => {
        this.store = store;
        this.selectedManagerId = store.manager_id || '';
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error loading store details', error);
        this.isLoading = false;
        this.router.navigate(['/stores']);
      }
    });
  }

  loadManagers(): void {
    // First, load all the roles to get the Manager role ID
    this.roleService.getRoles().subscribe({
      next: (roles: any[]) => {
        console.log('All roles:', roles);
        // Find the manager role
        const managerRole = roles.find((role: { name: string; }) => role.name === 'Manager');
        
        if (managerRole) {
          console.log('Manager role found:', managerRole);
          // Now get users with the manager role ID
          this.userService.getUsers().subscribe({
            next: (users) => {
              console.log('All users:', users);
              // Filter users who have the manager role ID
              this.managers = users.filter(user => user.role_id === managerRole._id);
              console.log('Filtered managers:', this.managers);
            },
            error: (error) => {
              console.error('Error loading users', error);
            }
          });
        } else {
          console.error('Manager role not found');
        }
      },
      error: (error: any) => {
        console.error('Error loading roles', error);
      }
    });
  }

  // In store-detail.component.ts
// In store-detail.component.ts
assignManager(): void {
  if (!this.store || !this.selectedManagerId) return;
  
  this.isAssigningManager = true;
  
  // Log what we're sending
  console.log(`Assigning manager ${this.selectedManagerId} to store ${this.store.id}`);
  
  this.storeService.assignManager(this.store.id, this.selectedManagerId).subscribe({
    next: (response) => {
      console.log('Updated store data:', response);
      
      // Find the selected manager to ensure we have the name
      const selectedManager = this.managers.find(m => m._id === this.selectedManagerId);
      
      if (response.status === 'success' && selectedManager) {
        // Update only the manager-related fields, not the entire store object
        if (this.store) {
          this.store.manager_id = this.selectedManagerId;
          this.store.manager_name = selectedManager.full_name;
        }
        
        console.log('Updated store with manager:', this.store);
      }
      
      this.isAssigningManager = false;
    },
    error: (error) => {
      console.error('Error assigning manager:', error);
      this.isAssigningManager = false;
    }
  });
}

  deleteStore(): void {
    if (!this.store) return;
    
    if (confirm('Are you sure you want to delete this store?')) {
      this.isLoading = true;
      this.storeService.deleteStore(this.store.id).subscribe({
        next: () => {
          this.router.navigate(['/stores']);
        },
        error: (error: any) => {
          console.error('Error deleting store', error);
          this.isLoading = false;
        }
      });
    }
  }
}