// src/app/features/auth/login/login.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="p-6 bg-white rounded-lg shadow-md">
      <h2 class="text-2xl font-bold mb-6">Login</h2>
      
      <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
        <div class="mb-4">
          <label for="email" class="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input 
            type="email" 
            id="email" 
            formControlName="email"
            class="form-control"
            [ngClass]="{'border-red-500': submitted && f['email'].errors}"
          >
          <div *ngIf="submitted && f['email'].errors" class="mt-1 text-red-500 text-xs">
            <div *ngIf="f['email'].errors['required']">Email is required</div>
            <div *ngIf="f['email'].errors['email']">Please enter a valid email</div>
          </div>
        </div>
        
        <div class="mb-6">
          <label for="password" class="block text-sm font-medium text-gray-700 mb-1">Password</label>
          <input 
            type="password" 
            id="password" 
            formControlName="password"
            class="form-control"
            [ngClass]="{'border-red-500': submitted && f['password'].errors}"
          >
          <div *ngIf="submitted && f['password'].errors" class="mt-1 text-red-500 text-xs">
            <div *ngIf="f['password'].errors['required']">Password is required</div>
          </div>
        </div>
        
        <div class="mb-4">
          <button 
            type="submit" 
            class="btn btn-primary w-full flex justify-center"
            [disabled]="loading"
          >
            <span *ngIf="loading" class="mr-2">Loading...</span>
            Sign in
          </button>
        </div>
        
        <div *ngIf="error" class="text-red-500 text-center mt-2">{{ error }}</div>
      </form>
    </div>
  `
})
export class LoginComponent {
  loginForm: FormGroup;
  loading = false;
  submitted = false;
  error = '';
  returnUrl: string = '/dashboard';
  
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

    // Get return url from route parameters or default to dashboard
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
  }
  
  // Convenience getter for form fields
  get f() { return this.loginForm.controls; }
  
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