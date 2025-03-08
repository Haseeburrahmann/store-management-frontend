// src/app/app.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  template: `<router-outlet></router-outlet>`,
  styles: [`
    :host {
      display: block;
      height: 100%;
    }
  `]
})
export class AppComponent implements OnInit {
  constructor(private authService: AuthService) {}
  
  ngOnInit() {
    // Initialize auth state
    const token = localStorage.getItem('auth_token');
    if (token) {
      this.authService.loadCurrentUser().subscribe();
    }
  }
}