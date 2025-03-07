// src/app/shared/components/error-display/error-display.component.ts
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { AbstractControl, FormGroup } from '@angular/forms';
import { animate, style, transition, trigger } from '@angular/animations';

@Component({
  selector: 'app-error-display',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <div *ngIf="shouldDisplayError()" [@slideInOut] class="error-container">
      <mat-icon>error_outline</mat-icon>
      <span class="error-message">{{ errorMessage }}</span>
    </div>
  `,
  styles: [`
    .error-container {
      display: flex;
      align-items: center;
      color: var(--app-error);
      font-size: 12px;
      margin-top: 4px;
      padding: 4px 0;
    }
    
    mat-icon {
      font-size: 16px;
      height: 16px;
      width: 16px;
      margin-right: 4px;
    }
    
    .error-message {
      line-height: 1.4;
    }
  `],
  animations: [
    trigger('slideInOut', [
      transition(':enter', [
        style({ opacity: 0, height: 0, transform: 'translateY(-10px)' }),
        animate('200ms ease-out', style({ opacity: 1, height: '*', transform: 'translateY(0)' }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ opacity: 0, height: 0, transform: 'translateY(-10px)' }))
      ])
    ])
  ]
})
export class ErrorDisplayComponent {
  @Input() control: AbstractControl | null = null;
  @Input() form: FormGroup | null = null;
  @Input() controlName: string = '';
  @Input() customMessage: string = '';
  @Input() showOnDirty: boolean = true;
  @Input() showOnTouched: boolean = true;
  
  // Error message mappings
  private errorMessages: { [key: string]: string } = {
    required: 'This field is required',
    email: 'Please enter a valid email address',
    minlength: 'Input is too short',
    maxlength: 'Input is too long',
    pattern: 'Invalid format',
    min: 'Value is too small',
    max: 'Value is too large',
    matDatepickerMin: 'Date is too early',
    matDatepickerMax: 'Date is too late',
    passwordMismatch: 'Passwords do not match',
    invalidCredentials: 'Invalid username or password',
    uniqueConstraint: 'This value already exists',
    serverError: 'A server error occurred',
    // Add more as needed
  };
  
  constructor() {}
  
  shouldDisplayError(): boolean {
    // Use direct control if provided
    if (this.control) {
      return this.checkControlErrors(this.control);
    }
    
    // Use form + controlName if provided
    if (this.form && this.controlName) {
      const control = this.form.get(this.controlName);
      if (control) {
        return this.checkControlErrors(control);
      }
    }
    
    // If custom message is provided, always show it
    return !!this.customMessage;
  }
  
  private checkControlErrors(control: AbstractControl): boolean {
    const invalid = control.invalid;
    const dirty = control.dirty;
    const touched = control.touched;
    
    // Respect showOnDirty and showOnTouched flags
    const shouldShowBasedOnState = 
      (this.showOnDirty && dirty) || 
      (this.showOnTouched && touched) || 
      (control.errors && control.errors['serverError']); // Always show server errors
      
    return invalid && shouldShowBasedOnState;
  }
  
  get errorMessage(): string {
    // If custom message is provided, return it
    if (this.customMessage) {
      return this.customMessage;
    }
    
    // Use direct control if provided
    if (this.control && this.control.errors) {
      return this.getErrorMessageFromControl(this.control);
    }
    
    // Use form + controlName if provided
    if (this.form && this.controlName) {
      const control = this.form.get(this.controlName);
      if (control && control.errors) {
        return this.getErrorMessageFromControl(control);
      }
    }
    
    return '';
  }
  
  private getErrorMessageFromControl(control: AbstractControl): string {
    if (!control.errors) return '';
    
    // Get the first error
    const errorType = Object.keys(control.errors)[0];
    const error = control.errors[errorType];
    
    // Handle special error types with dynamic content
    if (errorType === 'minlength') {
      return `Please enter at least ${error.requiredLength} characters`;
    }
    
    if (errorType === 'maxlength') {
      return `Cannot exceed ${error.requiredLength} characters`;
    }
    
    if (errorType === 'min') {
      return `Value must be at least ${error.min}`;
    }
    
    if (errorType === 'max') {
      return `Value cannot exceed ${error.max}`;
    }
    
    // Look up the error message in our mappings
    return this.errorMessages[errorType] || 'Invalid input';
  }
}