// src/app/app.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from './core/services/auth.service';
import { AppNavigationComponent } from './features/navigation/navigation.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatSnackBarModule,
    AppNavigationComponent
  ],
  template: `
    <div *ngIf="isLoggedIn">
      <app-navigation>
        <router-outlet></router-outlet>
      </app-navigation>
    </div>
    
    <div *ngIf="!isLoggedIn">
      <router-outlet></router-outlet>
    </div>
  `,
  styles: []
})
export class AppComponent implements OnInit {
  isLoggedIn = false;
  
  constructor(private authService: AuthService) {}
  
  ngOnInit() {
    this.authService.user$.subscribe(user => {
      this.isLoggedIn = !!user;
    });
  }
}