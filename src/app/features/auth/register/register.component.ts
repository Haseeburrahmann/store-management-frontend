import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';
import { UserCreate } from '../../../core/auth/models/user.model';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCardModule,
    MatProgressBarModule,
    RouterModule
  ],
  template: `
    <div class="register-container">
      <mat-card class="register-card">
        <mat-card-header>
          <mat-card-title>Register</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <form [formGroup]="registerForm" (ngSubmit)="onSubmit()">
            <div class="form-field-container">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Email</mat-label>
                <input matInput formControlName="email" type="email" required>
                @if (registerForm.get('email')?.invalid && registerForm.get('email')?.touched) {
                  <mat-error>Valid email is required</mat-error>
                }
              </mat-form-field>
              
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Full Name</mat-label>
                <input matInput formControlName="full_name">
                @if (registerForm.get('full_name')?.invalid && registerForm.get('full_name')?.touched) {
                  <mat-error>Full name is required</mat-error>
                }
              </mat-form-field>
              
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Phone Number</mat-label>
                <input matInput formControlName="phone_number">
              </mat-form-field>
              
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Password</mat-label>
                <input matInput formControlName="password" type="password" required>
                @if (registerForm.get('password')?.invalid && registerForm.get('password')?.touched) {
                  <mat-error>
                    Password must be at least 6 characters
                  </mat-error>
                }
              </mat-form-field>
              
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Confirm Password</mat-label>
                <input matInput formControlName="confirmPassword" type="password" required>
                @if (registerForm.get('confirmPassword')?.invalid && registerForm.get('confirmPassword')?.touched) {
                  <mat-error>
                    Passwords do not match
                  </mat-error>
                }
              </mat-form-field>
            </div>
            
            @if (error) {
              <div class="error-message">
                {{ error }}
              </div>
            }
            
            <div class="actions">
              <button mat-raised-button color="primary" type="submit" [disabled]="registerForm.invalid || isLoading">
                @if (isLoading) {
                  Registering...
                } @else {
                  Register
                }
              </button>
              <a mat-button routerLink="/login">Already have an account?</a>
            </div>
            
            @if (isLoading) {
              <mat-progress-bar mode="indeterminate" class="mt-3"></mat-progress-bar>
            }
          </form>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .register-container {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      background-color: #f5f5f5;
    }
    
    .register-card {
      width: 400px;
      max-width: 90%;
      padding: 20px;
    }
    
    .form-field-container {
      display: flex;
      flex-direction: column;
      margin-bottom: 20px;
    }
    
    .full-width {
      width: 100%;
      margin-bottom: 15px;
    }
    
    .actions {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 20px;
    }
    
    .error-message {
      color: #f44336;
      margin-top: 10px;
      font-size: 14px;
    }
    
    mat-card-header {
      margin-bottom: 20px;
    }
    
    .mt-3 {
      margin-top: 15px;
    }
  `]
})
export class RegisterComponent {
  registerForm: FormGroup;
  error: string = '';
  isLoading: boolean = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.registerForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      full_name: ['', Validators.required],
      phone_number: [''],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    }, { validator: this.checkPasswords });
  }

  checkPasswords(group: FormGroup) {
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;

    return password === confirmPassword ? null : { notMatching: true };
  }

  onSubmit(): void {
    if (this.registerForm.valid) {
      this.isLoading = true;
      this.error = '';
      
      const { email, full_name, phone_number, password } = this.registerForm.value;
      
      // Create UserCreate object with our model format
      const userData: UserCreate = {
        email,
        full_name,
        phone_number,
        password
      };

      this.authService.register(userData).subscribe({
        next: () => {
          this.isLoading = false;
          this.router.navigate(['/login']);
        },
        error: (err) => {
          this.isLoading = false;
          
          // Use the standardized error handling
          if (err instanceof Error) {
            this.error = err.message;
          } else if (err.error && err.error.detail) {
            this.error = err.error.detail;
          } else {
            this.error = 'Registration failed. Please try again.';
          }
          
          console.error('Registration error:', err);
        }
      });
    }
  }
}