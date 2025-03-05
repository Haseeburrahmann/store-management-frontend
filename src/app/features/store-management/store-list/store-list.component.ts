// src/app/features/store-management/store-list/store-list.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { StoreService } from '../../../core/services/store.service';
import { UserService } from '../../../core/services/user.service';
import { AuthService } from '../../../core/services/auth.service';
import { Store } from '../../../shared/models/store.model';
import { User } from '../../../core/auth/models/user.model';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSortModule } from '@angular/material/sort';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { filter, Subscription } from 'rxjs';

// Extended store interface to handle legacy properties
interface ExtendedStore extends Store {
  manager_name?: string;
  id?: string;
}

@Component({
  selector: 'app-store-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatSortModule,
    MatCardModule,
    MatChipsModule,
    MatDialogModule,
    MatSnackBarModule
  ],
  templateUrl: './store-list.component.html',
  styleUrls: ['./store-list.component.scss']
})
export class StoreListComponent implements OnInit, OnDestroy {
  stores: ExtendedStore[] = [];
  displayedColumns: string[] = ['name', 'address', 'city', 'state', 'phone', 'manager', 'status', 'actions'];
  isLoading = true;
  totalStores = 0;
  pageSize = 10;
  pageSizeOptions: number[] = [5, 10, 25, 50];
  currentPage = 0;
  searchName: string = '';
  searchCity: string = '';
  managers: User[] = [];
  error: string = '';
  
  // Permission flags
  canCreateStore = false;
  canEditStore = false;
  canDeleteStore = false;
  
  private routerSubscription?: Subscription;
  private userSubscription?: Subscription;
  
  constructor(
    private storeService: StoreService,
    private userService: UserService,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    this.checkPermissions();
    this.loadManagersAndStores();
    
    // Subscribe to router events to reload data when navigating to this component
    this.routerSubscription = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.loadManagersAndStores();
    });
  }
  
  ngOnDestroy(): void {
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
    
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
  }
  
  checkPermissions(): void {
    this.userSubscription = this.authService.user$.subscribe(user => {
      if (user) {
        this.canCreateStore = this.authService.hasPermission('stores', 'write');
        this.canEditStore = this.authService.hasPermission('stores', 'write');
        this.canDeleteStore = this.authService.hasPermission('stores', 'delete');
      }
    });
  }

  loadManagersAndStores(): void {
    this.isLoading = true;
    this.error = '';
    
    // First load all users to get manager information
    this.userService.getUsers().subscribe({
      next: (users) => {
        this.managers = users;
        // After managers are loaded, load the stores
        this.loadStores();
      },
      error: (error) => {
        this.error = error.message || 'Error loading users';
        console.error('Error loading users:', error);
        this.snackBar.open('Error loading users: ' + this.error, 'Close', { duration: 3000 });
        // Still try to load stores even if managers fail
        this.loadStores();
      }
    });
  }

  loadStores(): void {
    const searchParam = this.searchName !== undefined && !isNaN(Number(this.searchName)) ? Number(this.searchName) : undefined;
    const statusParam = undefined;
    const skipParam = this.currentPage !== undefined ? String(this.currentPage) : undefined;
    const limitParam = this.pageSize !== undefined ? String(this.pageSize) : undefined;

    this.storeService.getStores(searchParam, statusParam, skipParam, limitParam).subscribe({
        next: (stores) => {
        // Process stores to add legacy properties
        this.stores = stores.map((store: Store) => {
          const extendedStore = store as ExtendedStore;
          
          // Add legacy id property
          extendedStore.id = store._id;
          
          // Add manager_name property for backward compatibility
          if (store.manager_id) {
            const manager = this.managers.find(m => m._id === store.manager_id);
            if (manager) {
              extendedStore.manager_name = manager.full_name;
            }
          } else if (store.manager && store.manager.full_name) {
            extendedStore.manager_name = store.manager.full_name;
          }
          
          return extendedStore;
        });
        
        this.totalStores = stores.length;
        this.isLoading = false;
      },
      error: (error) => {
        this.isLoading = false;
        this.error = error.message || 'Error loading stores';
        console.error('Error loading stores', error);
        this.snackBar.open('Error loading stores: ' + this.error, 'Close', { duration: 3000 });
      }
    });
  }

  onPageChange(event: PageEvent): void {
    this.pageSize = event.pageSize;
    this.currentPage = event.pageIndex;
    this.loadStores();
  }

  applyFilter(): void {
    this.currentPage = 0;
    this.loadStores();
  }

  resetFilter(): void {
    this.searchName = '';
    this.searchCity = '';
    this.currentPage = 0;
    this.loadStores();
  }

  deleteStore(storeId: string): void {
    if (confirm('Are you sure you want to delete this store?')) {
      this.storeService.deleteStore(storeId).subscribe({
        next: () => {
          this.snackBar.open('Store deleted successfully', 'Close', { duration: 3000 });
          this.loadStores();
        },
        error: (error) => {
          this.error = error.message || 'Error deleting store';
          console.error('Error deleting store:', error);
          this.snackBar.open('Error deleting store: ' + this.error, 'Close', { duration: 3000 });
        }
      });
    }
  }
}