// src/app/shared/components/form-field/form-field.component.ts
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormGroup } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ErrorDisplayComponent } from '../error-display/error-display.component';

@Component({
  selector: 'app-form-field',
  standalone: true,
  imports: [
    CommonModule, 
    MatFormFieldModule, 
    MatInputModule, 
    MatIconModule, 
    MatTooltipModule,
    ErrorDisplayComponent
  ],
  template: `
    <div class="form-field-container">
      <div *ngIf="label" class="field-label">
        {{ label }}
        <span *ngIf="required" class="required-indicator">*</span>
        
        <mat-icon 
          *ngIf="helpText" 
          class="help-icon" 
          [matTooltip]="helpText">
          help_outline
        </mat-icon>
      </div>
      
      <div class="field-content">
        <ng-content></ng-content>
      </div>
      
      <app-error-display
        [control]="control"
        [form]="form"
        [controlName]="controlName">
      </app-error-display>
      
      <div *ngIf="hint" class="field-hint">
        {{ hint }}
      </div>
    </div>
  `,
  styles: [`
    .form-field-container {
      margin-bottom: 20px;
      width: 100%;
    }
    
    .field-label {
      display: flex;
      align-items: center;
      font-size: 14px;
      font-weight: 500;
      margin-bottom: 8px;
      color: var(--app-text);
    }
    
    .required-indicator {
      color: var(--app-error);
      margin-left: 4px;
    }
    
    .help-icon {
      font-size: 16px;
      height: 16px;
      width: 16px;
      margin-left: 8px;
      color: rgba(0, 0, 0, 0.54);
      cursor: help;
    }
    
    .field-hint {
      font-size: 12px;
      color: rgba(0, 0, 0, 0.6);
      margin-top: 4px;
    }
    
    .field-content {
      width: 100%;
    }
    
    :host-context(.dark-theme) {
      .help-icon {
        color: rgba(255, 255, 255, 0.7);
      }
      
      .field-hint {
        color: rgba(255, 255, 255, 0.6);
      }
    }
    
    :host-context(.compact) {
      .form-field-container {
        margin-bottom: 16px;
      }
      
      .field-label {
        font-size: 13px;
        margin-bottom: 6px;
      }
    }
    
    :host-context(.horizontal) {
      .form-field-container {
        display: flex;
        flex-wrap: wrap;
      }
      
      .field-label {
        width: 180px;
        margin-bottom: 0;
        padding-right: 16px;
      }
      
      .field-content {
        flex: 1;
        min-width: 0;
      }
      
      .field-hint, app-error-display {
        margin-left: 180px;
        width: calc(100% - 180px);
      }
    }
  `]
})
export class FormFieldComponent {
  @Input() label: string = '';
  @Input() required: boolean = false;
  @Input() helpText: string = '';
  @Input() hint: string = '';
  @Input() control: AbstractControl | null = null;
  @Input() form: FormGroup | null = null;
  @Input() controlName: string = '';
}