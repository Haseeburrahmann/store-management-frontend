// src/app/features/navigation/header/header.component.ts
import { Component, EventEmitter, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';

import { AuthService } from '../../../core/services/auth.service';
import { User } from '../../../shared/models/user.model';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule, 
    MatToolbarModule, 
    MatButtonModule, 
    MatIconModule,
    MatMenuModule
  ],
  template: `
    <mat-toolbar color="primary" class="header-toolbar">
      <button 
        mat-icon-button 
        class="menu-button"
        aria-label="Toggle sidebar"
        (click)="toggleSidenav.emit()">
        <mat-icon>menu</mat-icon>
      </button>
      
      <a routerLink="/" class="logo">
        <span class="app-name">Store Management</span>
      </a>
      
      <span class="spacer"></span>
      
      <div class="user-menu" *ngIf="user">
        <button mat-button [matMenuTriggerFor]="userMenu" class="user-button">
          <mat-icon>account_circle</mat-icon>
          <span class="user-name">{{ user.full_name }}</span>
          <mat-icon>arrow_drop_down</mat-icon>
        </button>
        
        <mat-menu #userMenu="matMenu" xPosition="before">
          <button mat-menu-item routerLink="/auth/profile">
            <mat-icon>person</mat-icon>
            <span>Profile</span>
          </button>
          
          <button mat-menu-item (click)="logout()">
            <mat-icon>exit_to_app</mat-icon>
            <span>Logout</span>
          </button>
        </mat-menu>
      </div>
    </mat-toolbar>
  `,
  styles: [`
    .header-toolbar {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 2;
      padding: 0 16px;
    }
    
    .logo {
      text-decoration: none;
      color: white;
      margin-left: 8px;
      display: flex;
      align-items: center;
    }
    
    .app-name {
      font-size: 20px;
      font-weight: 500;
    }
    
    .spacer {
      flex: 1 1 auto;
    }
    
    .user-button {
      display: flex;
      align-items: center;
    }
    
    .user-name {
      margin: 0 8px;
    }
  `]
})
export class HeaderComponent implements OnInit {
  @Output() toggleSidenav = new EventEmitter<void>();
  user: User | null = null;
  
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}
  
  ngOnInit(): void {
    // Subscribe to the user observable to get updates
    this.authService.currentUser$.subscribe(user => {
      this.user = user;
    });
  }
  
  logout(): void {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }
}