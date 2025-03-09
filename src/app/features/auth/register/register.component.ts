// src/app/features/auth/register/register.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="card max-w-md w-full mx-auto">
      <div class="text-center mb-6">
        <h2 class="text-2xl font-bold">Create an Account</h2>
        <p class="text-sm text-[var(--text-secondary)] mt-1">Fill in the details to create your account</p>
      </div>
      
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
      
      <form [formGroup]="registerForm" (ngSubmit)="onSubmit()">
        <div class="form-group">
          <label for="full_name" class="form-label required">Full Name</label>
          <input 
            type="text" 
            id="full_name" 
            formControlName="full_name"
            class="form-control"
            [ngClass]="{'border-red-500 dark:border-red-400': submitted && f['full_name'].errors}"
            placeholder="John Doe"
          >
          <div *ngIf="submitted && f['full_name'].errors" class="form-error">
            <div *ngIf="f['full_name'].errors['required']">Full name is required</div>
          </div>
        </div>
        
        <div class="form-group">
          <label for="email" class="form-label required">Email</label>
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
          <label for="phone_number" class="form-label">Phone Number</label>
          <input 
            type="tel" 
            id="phone_number" 
            formControlName="phone_number"
            class="form-control"
            placeholder="123-456-7890"
          >
        </div>
        
        <div class="form-group">
          <label for="password" class="form-label required">Password</label>
          <input 
            type="password" 
            id="password" 
            formControlName="password"
            class="form-control"
            [ngClass]="{'border-red-500 dark:border-red-400': submitted && f['password'].errors}"
            placeholder="••••••••"
          >
          <div *ngIf="submitted && f['password'].errors" class="form-error">
            <div *ngIf="f['password'].errors['required']">Password is required</div>
            <div *ngIf="f['password'].errors['minlength']">Password must be at least 8 characters</div>
          </div>
        </div>
        
        <div class="form-group">
          <label for="confirm_password" class="form-label required">Confirm Password</label>
          <input 
            type="password" 
            id="confirm_password" 
            formControlName="confirm_password"
            class="form-control"
            [ngClass]="{'border-red-500 dark:border-red-400': submitted && (f['confirm_password'].errors || passwordMismatch)}"
            placeholder="••••••••"
          >
          <div *ngIf="submitted && (f['confirm_password'].errors || passwordMismatch)" class="form-error">
            <div *ngIf="f['confirm_password'].errors?.['required']">Please confirm your password</div>
            <div *ngIf="passwordMismatch">Passwords do not match</div>
          </div>
        </div>
        
        <div class="form-group">
          <div class="flex items-center">
            <input 
              id="terms" 
              type="checkbox" 
              formControlName="terms"
              class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800"
              [ngClass]="{'border-red-500': submitted && f['terms'].errors}"
            >
            <label for="terms" class="ml-2 block text-sm text-[var(--text-primary)]">
              I agree to the <a href="#" class="text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300">Terms of Service</a> and <a href="#" class="text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300">Privacy Policy</a>
            </label>
          </div>
          <div *ngIf="submitted && f['terms'].errors" class="form-error">
            <div *ngIf="f['terms'].errors['required']">You must agree to the terms and conditions</div>
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
            Create Account
          </button>
        </div>
      </form>
      
      <div class="mt-6 text-center text-sm">
        <span class="text-[var(--text-secondary)]">Already have an account?</span>
        <a routerLink="/auth/login" class="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300">
          Sign in
        </a>
      </div>
    </div>
  `,
  styles: [`
    .required:after {
      content: " *";
      color: #ef4444;
    }
  `]
})
export class RegisterComponent implements OnInit {
  registerForm: FormGroup;
  loading = false;
  submitted = false;
  error = '';
  passwordMismatch = false;
  
  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.registerForm = this.formBuilder.group({
      full_name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone_number: [''],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirm_password: ['', Validators.required],
      terms: [false, Validators.requiredTrue]
    });
  }
  
  ngOnInit(): void {
    // Auto redirect if already logged in
    if (this.authService.isAuthenticated) {
      this.router.navigate(['/dashboard']);
    }
  }
  
  // Convenience getter for form fields
  get f() { return this.registerForm.controls; }
  
  onSubmit(): void {
    this.submitted = true;
    this.error = '';
    this.passwordMismatch = false;
    
    // Stop here if form is invalid
    if (this.registerForm.invalid) {
      return;
    }
    
    // Check if passwords match
    if (this.f['password'].value !== this.f['confirm_password'].value) {
      this.passwordMismatch = true;
      return;
    }
    
    this.loading = true;
    
    const userData = {
      full_name: this.f['full_name'].value,
      email: this.f['email'].value,
      phone_number: this.f['phone_number'].value,
      password: this.f['password'].value
    };
    
    this.authService.register(userData)
      .pipe(
        finalize(() => this.loading = false)
      )
      .subscribe({
        next: () => {
          // Registration successful, redirect to login page
          this.router.navigate(['/auth/login'], { 
            queryParams: { registered: 'true' }
          });
        },
        error: err => {
          this.error = err.message || 'Registration failed. Please try again.';
        }
      });
  }
}