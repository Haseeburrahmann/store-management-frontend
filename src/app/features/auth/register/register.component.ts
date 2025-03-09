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
          <div class="relative">
            <input 
              [type]="showPassword ? 'text' : 'password'" 
              id="password" 
              formControlName="password"
              class="form-control pr-10"
              [ngClass]="{'border-red-500 dark:border-red-400': submitted && f['password'].errors}"
              placeholder="••••••••"
              (input)="checkPasswordStrength()"
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
          
          <!-- Password strength indicator -->
          <div class="mt-2" *ngIf="f['password'].value">
            <div class="flex justify-between mb-1">
              <span class="text-xs font-medium text-[var(--text-secondary)]">Password Strength</span>
              <span class="text-xs font-medium" [ngClass]="passwordStrengthClass">{{ passwordStrengthLabel }}</span>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-1.5 dark:bg-gray-700">
              <div class="h-1.5 rounded-full" [ngClass]="passwordStrengthBarClass" [style.width.%]="passwordStrength"></div>
            </div>
            <div class="mt-1 text-xs text-[var(--text-secondary)]">
              <ul class="list-disc list-inside space-y-0.5">
                <li [ngClass]="{'text-green-600 dark:text-green-500': hasLength}">At least 8 characters</li>
                <li [ngClass]="{'text-green-600 dark:text-green-500': hasNumber}">Contains a number</li>
                <li [ngClass]="{'text-green-600 dark:text-green-500': hasSpecial}">Contains a special character</li>
                <li [ngClass]="{'text-green-600 dark:text-green-500': hasUpperLower}">Contains both uppercase and lowercase letters</li>
              </ul>
            </div>
          </div>
          
          <div *ngIf="submitted && f['password'].errors" class="form-error">
            <div *ngIf="f['password'].errors['required']">Password is required</div>
            <div *ngIf="f['password'].errors['minlength']">Password must be at least 8 characters</div>
          </div>
        </div>
        
        <div class="form-group">
          <label for="confirm_password" class="form-label required">Confirm Password</label>
          <div class="relative">
            <input 
              [type]="showConfirmPassword ? 'text' : 'password'" 
              id="confirm_password" 
              formControlName="confirm_password"
              class="form-control pr-10"
              [ngClass]="{'border-red-500 dark:border-red-400': submitted && (f['confirm_password'].errors || passwordMismatch)}"
              placeholder="••••••••"
            >
            <button 
              type="button" 
              class="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 dark:text-gray-400 focus:outline-none"
              (click)="toggleConfirmPasswordVisibility()"
            >
              <!-- Eye icon for show password -->
              <svg *ngIf="!showConfirmPassword" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              <!-- Eye-slash icon for hide password -->
              <svg *ngIf="showConfirmPassword" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
              </svg>
            </button>
          </div>
          
          <!-- Password match indicator -->
          <div class="mt-2" *ngIf="f['confirm_password'].value && f['password'].value">
            <div class="flex items-center text-sm">
              <svg *ngIf="passwordsMatch" class="h-4 w-4 text-green-500 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              <svg *ngIf="!passwordsMatch" class="h-4 w-4 text-red-500 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span [ngClass]="passwordsMatch ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'">
                {{ passwordsMatch ? 'Passwords match' : 'Passwords do not match' }}
              </span>
            </div>
          </div>
          
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
  showPassword = false;
  showConfirmPassword = false;
  passwordStrength = 0;
  passwordStrengthLabel = '';
  passwordStrengthClass = '';
  passwordStrengthBarClass = '';
  
  // Password strength criteria
  hasLength = false;
  hasNumber = false;
  hasSpecial = false;
  hasUpperLower = false;
  
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
    
    // Check password match whenever either password field changes
    this.registerForm.valueChanges.subscribe(() => {
      this.checkPasswordsMatch();
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
  
  // Toggle password visibility
  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }
  
  // Toggle confirm password visibility
  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }
  
  // Check if passwords match
  checkPasswordsMatch(): void {
    const password = this.f['password'].value;
    const confirmPassword = this.f['confirm_password'].value;
    
    if (password && confirmPassword) {
      this.passwordsMatch = password === confirmPassword;
    } else {
      this.passwordsMatch = false;
    }
  }
  
  // Check password strength
  checkPasswordStrength(): void {
    const password = this.f['password'].value || '';
    
    // Reset criteria
    this.hasLength = password.length >= 8;
    this.hasNumber = /\d/.test(password);
    this.hasSpecial = /[^A-Za-z0-9]/.test(password);
    this.hasUpperLower = /[A-Z]/.test(password) && /[a-z]/.test(password);
    
    // Calculate strength based on criteria
    let strength = 0;
    
    if (this.hasLength) strength += 25;
    if (this.hasNumber) strength += 25;
    if (this.hasSpecial) strength += 25;
    if (this.hasUpperLower) strength += 25;
    
    this.passwordStrength = strength;
    
    // Set label and classes based on strength
    if (strength === 0) {
      this.passwordStrengthLabel = '';
      this.passwordStrengthClass = '';
      this.passwordStrengthBarClass = '';
    } else if (strength <= 25) {
      this.passwordStrengthLabel = 'Weak';
      this.passwordStrengthClass = 'text-red-600 dark:text-red-500';
      this.passwordStrengthBarClass = 'bg-red-600 dark:bg-red-500';
    } else if (strength <= 50) {
      this.passwordStrengthLabel = 'Fair';
      this.passwordStrengthClass = 'text-orange-600 dark:text-orange-500';
      this.passwordStrengthBarClass = 'bg-orange-600 dark:bg-orange-500';
    } else if (strength <= 75) {
      this.passwordStrengthLabel = 'Good';
      this.passwordStrengthClass = 'text-yellow-600 dark:text-yellow-500';
      this.passwordStrengthBarClass = 'bg-yellow-600 dark:bg-yellow-500';
    } else {
      this.passwordStrengthLabel = 'Strong';
      this.passwordStrengthClass = 'text-green-600 dark:text-green-500';
      this.passwordStrengthBarClass = 'bg-green-600 dark:bg-green-500';
    }
    
    // Also check if passwords match
    this.checkPasswordsMatch();
  }
  
  // Used by the template to check if passwords match
  get passwordsMatch(): boolean {
    return this.f['password'].value === this.f['confirm_password'].value 
      && this.f['confirm_password'].value !== '';
  }
  
  // Set the passwordsMatch property
  set passwordsMatch(value: boolean) {
    this.passwordMismatch = !value;
  }
  
  onSubmit(): void {
    this.submitted = true;
    this.error = '';
    
    // Check password match
    if (this.f['password'].value !== this.f['confirm_password'].value) {
      this.passwordMismatch = true;
    } else {
      this.passwordMismatch = false;
    }
    
    // Stop here if form is invalid or passwords don't match
    if (this.registerForm.invalid || this.passwordMismatch) {
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