// src/app/features/auth/login/login.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="card max-w-md w-full mx-auto">
      <div class="text-center mb-6">
        <h2 class="text-2xl font-bold">Sign In</h2>
        <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">Enter your credentials to access your account</p>
      </div>
      
      <!-- Registration Success Message -->
      <div *ngIf="registrationSuccess" class="alert alert-success mb-4">
        <div class="flex">
          <div class="flex-shrink-0">
            <svg class="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
            </svg>
          </div>
          <div class="ml-3">
            <p class="text-sm">Registration successful! Please log in with your new account.</p>
          </div>
        </div>
      </div>
      
      <!-- Error Message -->
      <div *ngIf="error" class="alert alert-danger mb-4">
        <div class="flex">
          <div class="flex-shrink-0">
            <svg class="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
            </svg>
          </div>
          <div class="ml-3">
            <p class="text-sm">{{ error }}</p>
          </div>
        </div>
      </div>
      
      <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
        <div class="form-group">
          <label for="email" class="form-label">Email</label>
          <input 
            type="email" 
            id="email" 
            formControlName="email"
            class="form-control"
            [ngClass]="{'border-red-500 dark:border-red-400': submitted && f['email'].errors}"
            placeholder="you@example.com"
          >
          <div *ngIf="submitted && f['email'].errors" class="form-error">
            <div *ngIf="f['email'].errors['required']">Email is required</div>
            <div *ngIf="f['email'].errors['email']">Please enter a valid email</div>
          </div>
        </div>
        
        <div class="form-group">
          <div class="flex items-center justify-between">
            <label for="password" class="form-label">Password</label>
            <a href="#" class="text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300">
              Forgot password?
            </a>
          </div>
          <div class="relative">
            <input 
              [type]="showPassword ? 'text' : 'password'" 
              id="password" 
              formControlName="password"
              class="form-control pr-10"
              [ngClass]="{'border-red-500 dark:border-red-400': submitted && f['password'].errors}"
              placeholder="••••••••"
            >
            <button 
              type="button" 
              class="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 dark:text-gray-400 focus:outline-none"
              (click)="togglePasswordVisibility()"
            >
              <!-- Eye icon for show password -->
              <svg *ngIf="!showPassword" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              <!-- Eye-slash icon for hide password -->
              <svg *ngIf="showPassword" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
              </svg>
            </button>
          </div>
          <div *ngIf="submitted && f['password'].errors" class="form-error">
            <div *ngIf="f['password'].errors['required']">Password is required</div>
          </div>
        </div>
        
        <div class="form-group">
          <div class="flex items-center">
            <input id="remember_me" type="checkbox" class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800">
            <label for="remember_me" class="ml-2 block text-sm text-gray-700 dark:text-gray-400">
              Remember me
            </label>
          </div>
        </div>
        
        <div class="form-group mb-0">
          <button 
            type="submit" 
            class="btn btn-primary w-full flex justify-center"
            [disabled]="loading"
          >
            <span *ngIf="loading" class="mr-2">
              <!-- Loading spinner -->
              <svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </span>
            Sign in
          </button>
        </div>
      </form>
      
      <div class="mt-6 text-center text-sm">
        <span class="text-gray-600 dark:text-gray-400">Don't have an account?</span>
        <a routerLink="/auth/register" class="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300">
          Register now
        </a>
      </div>
    </div>
  `
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  loading = false;
  submitted = false;
  error = '';
  returnUrl: string = '/dashboard';
  registrationSuccess = false;
  showPassword = false;
  
  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }
  
  ngOnInit(): void {
    // Get return url from route parameters or default to dashboard
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
    
    // Check if user just registered successfully
    this.registrationSuccess = this.route.snapshot.queryParams['registered'] === 'true';
    
    // Auto redirect if already logged in
    if (this.authService.isAuthenticated) {
      this.router.navigate([this.returnUrl]);
    }
  }
  
  // Convenience getter for form fields
  get f() { return this.loginForm.controls; }
  
  // Toggle password visibility
  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }
  
  onSubmit() {
    this.submitted = true;
    
    // Stop here if form is invalid
    if (this.loginForm.invalid) {
      return;
    }
    
    this.loading = true;
    this.error = '';
    
    this.authService.login(this.loginForm.value.email, this.loginForm.value.password)
      .pipe(
        finalize(() => this.loading = false)
      )
      .subscribe({
        next: () => {
          // Wait for auth service to complete processing before navigating
          setTimeout(() => {
            console.log('Login successful, navigating to:', this.returnUrl);
            this.router.navigateByUrl(this.returnUrl);
          }, 500);
        },
        error: err => {
          this.error = err.message || 'Authentication failed';
        }
      });
    }
}