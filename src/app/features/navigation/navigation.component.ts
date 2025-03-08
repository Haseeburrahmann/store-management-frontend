// src/app/features/navigation/navigation.component.ts
import { Component, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatSidenav } from '@angular/material/sidenav';

import { HeaderComponent } from './header/header.component';
import { SidebarComponent } from './sidebar/sidebar.component';

@Component({
  selector: 'app-navigation',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatSidenavModule,
    HeaderComponent,
    SidebarComponent
  ],
  template: `
    <app-header (toggleSidenav)="sidenav.toggle()"></app-header>
    
    <mat-sidenav-container class="sidenav-container">
      <mat-sidenav 
        #sidenav 
        mode="side" 
        [opened]="true"
        class="sidenav">
        <app-sidebar></app-sidebar>
      </mat-sidenav>
      
      <mat-sidenav-content class="content">
        <div class="content-wrapper">
          <router-outlet></router-outlet>
        </div>
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
   styles: [`
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
    }
    
    .sidenav-container {
      flex: 1;
      margin-top: 64px; /* Height of the toolbar */
    }
    
    .sidenav {
      width: 250px;
    }
    
    .content {
      padding: 20px;
      background-color: #f5f5f5;
    }
    
    .content-wrapper {
      max-width: 1400px;
      margin: 0 auto;
    }
    
    @media (max-width: 600px) {
      .sidenav-container {
        margin-top: 56px; /* Mobile toolbar height */
      }
      
      .content {
        padding: 12px;
      }
    }
  `]
})
export class NavigationComponent {
  @ViewChild('sidenav') sidenav!: MatSidenav;
  
  constructor() {}
  
  closeSidenav() {
    if (this.sidenav && this.sidenav.mode === 'over') {
      this.sidenav.close();
    }
  }
}