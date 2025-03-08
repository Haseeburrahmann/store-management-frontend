// src/app/features/dashboard/dashboard.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { RouterModule } from '@angular/router';

import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { CardContainerComponent } from '../../shared/components/card-container/card-container.component';
import { AuthService } from '../../core/services/auth.service';
import { User } from '../../shared/models/user.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    RouterModule,
    PageHeaderComponent,
    CardContainerComponent
  ],
  template: `
    <div class="dashboard-container">
      <app-page-header 
        title="Dashboard" 
        subtitle="Welcome to the Store Management System">
      </app-page-header>
      
      <div class="dashboard-content">
        <div class="welcome-card">
          <app-card-container [title]="'Welcome, ' + getUserName()">
            <p>
              Welcome to the Store Management System. Use the navigation menu to access different sections of the application.
            </p>
            
            <div class="quick-actions">
              <h3>Quick Actions</h3>
              <div class="action-buttons">
              
              <button 
                mat-flat-button 
                color="primary" 
                routerLink="/users"
                *ngIf="canAccessUsers">
                <mat-icon>people</mat-icon>
                Manage Users
              </button>
              
                <button mat-flat-button color="primary" routerLink="/stores">
                  <mat-icon>store</mat-icon>
                  Manage Stores
                </button>
                
                <button mat-flat-button color="accent" routerLink="/employees">
                  <mat-icon>people</mat-icon>
                  Manage Employees
                </button>
                
                <button mat-flat-button color="warn" routerLink="/hours">
                  <mat-icon>schedule</mat-icon>
                  Track Hours
                </button>
              </div>
            </div>
          </app-card-container>
        </div>
        
        <!-- More dashboard widgets will be added here in future steps -->
      </div>
    </div>
  `,
  styles: [`
    .dashboard-container {
      padding: 16px;
    }
    
    .dashboard-content {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 20px;
      margin-top: 20px;
    }
    
    .welcome-card {
      grid-column: 1 / -1;
    }
    
    .quick-actions {
      margin-top: 20px;
    }
    
    .action-buttons {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      margin-top: 10px;
    }
    
    .action-buttons button {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    @media (max-width: 600px) {
      .dashboard-content {
        grid-template-columns: 1fr;
      }
      
      .action-buttons {
        flex-direction: column;
      }
    }
  `]
})
export class DashboardComponent implements OnInit {
  constructor(private authService: AuthService) {}
  
  ngOnInit(): void {
    // Dashboard initialization logic here
    
  }
  
  getUserName(): string {
    const user = this.authService.currentUserValue;
    return user ? user.full_name : 'User';
  }

  get canAccessUsers(): boolean {
    const user = this.authService.currentUserValue;
    console.log('Current user:', user);
    
    const hasPermission = this.authService.hasPermission('users:read');
    console.log('Can access users:', hasPermission);
    
    // Temporarily return true to test
    // return true;
    
    return hasPermission;
  }
}