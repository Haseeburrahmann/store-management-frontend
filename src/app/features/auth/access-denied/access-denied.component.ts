// src/app/features/auth/access-denied/access-denied.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-access-denied',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page-container flex flex-col items-center justify-center min-h-screen p-4 text-center">
      <div class="mb-6">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-24 w-24 text-red-500 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m0 0v2m0-2h2m-2 0H9m3-3a3 3 0 100-6 3 3 0 000 6zm-1.5-12a4.5 4.5 0 100 9 4.5 4.5 0 000-9zm0 0V1.5m4.5 4.5h-9" />
        </svg>
      </div>
      
      <h1 class="text-3xl font-bold text-[var(--text-primary)] mb-2">Access Denied</h1>
      <p class="text-[var(--text-secondary)] max-w-lg mb-8">
        You don't have the necessary permissions to access this page. 
        Please contact your administrator if you believe this is an error.
      </p>
      
      <div class="flex flex-col sm:flex-row gap-4">
        <button class="btn btn-primary" (click)="goBack()">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Go Back
        </button>
        
        <a routerLink="/dashboard" class="btn btn-outline">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          Go to Dashboard
        </a>
      </div>
    </div>
  `
})
export class AccessDeniedComponent {
  constructor(private router: Router) {}
  
  goBack(): void {
    window.history.back();
  }
}