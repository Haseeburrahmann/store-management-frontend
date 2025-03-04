// src/app/features/store-management/store-list/store-list.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { StoreService } from '../../../core/auth/services/store.service';
import { UserService } from '../../../core/auth/services/user.service';
import { Store } from '../../../shared/models/store.model';
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
import { filter } from 'rxjs';

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
    MatDialogModule
  ],
  templateUrl: './store-list.component.html',
  styleUrls: ['./store-list.component.scss']
})
export class StoreListComponent implements OnInit {
  stores: Store[] = [];
  displayedColumns: string[] = ['name', 'address', 'city', 'state', 'phone', 'manager', 'status', 'actions'];
  isLoading = true;
  totalStores = 0;
  pageSize = 10;
  pageSizeOptions: number[] = [5, 10, 25, 50];
  currentPage = 0;
  searchName: string = '';
  searchCity: string = '';
  managers: any[] = [];
  
  constructor(
    private storeService: StoreService,
    private userService: UserService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadManagersAndStores();
    
    // Subscribe to router events to reload data when navigating to this component
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.loadManagersAndStores();
    });
  }

  loadManagersAndStores(): void {
    this.isLoading = true;
    
    // First load all users to get manager information
    this.userService.getUsers().subscribe({
      next: (users) => {
        this.managers = users;
        // After managers are loaded, load the stores
        this.loadStores();
      },
      error: (error) => {
        console.error('Error loading users:', error);
        // Still try to load stores even if managers fail
        this.loadStores();
      }
    });
  }

  loadStores(): void {
    this.storeService.getStores(
      this.currentPage * this.pageSize,
      this.pageSize,
      this.searchName || undefined,
      this.searchCity || undefined
    ).subscribe({
      next: (stores: any) => {
        // Add manager names to stores based on manager_id
        this.stores = stores.map((store: any) => {
          if (store.manager_id) {
            const manager = this.managers.find(m => m._id === store.manager_id);
            if (manager) {
              return {
                ...store,
                manager_name: manager.full_name
              };
            }
          }
          return store;
        });
        
        this.totalStores = stores.length;
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error loading stores', error);
        this.isLoading = false;
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

  deleteStore(id: string): void {
    if (confirm('Are you sure you want to delete this store?')) {
      this.storeService.deleteStore(id).subscribe({
        next: () => {
          this.loadStores();
        },
        error: (error: any) => {
          console.error('Error deleting store', error);
        }
      });
    }
  }
}