// src/app/shared/components/form-actions/form-actions.component.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { IconService } from '../../../core/services/icon.service';

@Component({
  selector: 'app-form-actions',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule],
  template: `
    <div class="form-actions" [class.centered]="centered" [class.vertical]="vertical">
      <!-- Submit Button -->
      <button 
        *ngIf="showSubmit"
        mat-flat-button 
        color="primary" 
        type="submit"
        [disabled]="submitDisabled || loading"
        (click)="onSubmit.emit()">
        <mat-icon *ngIf="submitIcon">{{ submitIcon }}</mat-icon>
        {{ submitLabel }}
      </button>
      
      <!-- Save Draft Button -->
      <button 
        *ngIf="showSaveDraft"
        mat-stroked-button 
        color="primary" 
        type="button"
        [disabled]="loading"
        (click)="onSaveDraft.emit()">
        <mat-icon>save</mat-icon>
        Save Draft
      </button>
      
      <!-- Cancel Button -->
      <button 
        *ngIf="showCancel"
        mat-stroked-button 
        type="button"
        [disabled]="loading"
        (click)="onCancel.emit()">
        {{ cancelLabel }}
      </button>
      
      <!-- Delete Button -->
      <button 
        *ngIf="showDelete"
        mat-stroked-button 
        color="warn" 
        type="button"
        [disabled]="loading"
        (click)="onDelete.emit()">
        <mat-icon>{{ iconService.getActionIcon('delete') }}</mat-icon>
        {{ deleteLabel }}
      </button>
      
      <!-- Custom Buttons - Left Side -->
      <ng-content select="[left]"></ng-content>
      
      <!-- Spacer -->
      <div class="spacer"></div>
      
      <!-- Custom Buttons - Right Side -->
      <ng-content select="[right]"></ng-content>
      
      <!-- Loading Indicator -->
      <div *ngIf="loading" class="loading-indicator">
        <div class="spinner"></div>
        <span>{{ loadingText }}</span>
      </div>
    </div>
  `,
  styles: [`
    .form-actions {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-top: 24px;
      padding-top: 16px;
      border-top: 1px solid rgba(0, 0, 0, 0.12);
    }
    
    .form-actions.centered {
      justify-content: center;
    }
    
    .form-actions.vertical {
      flex-direction: column;
      align-items: flex-start;
    }
    
    .spacer {
      flex: 1;
    }
    
    .loading-indicator {
      display: flex;
      align-items: center;
      font-size: 14px;
      color: rgba(0, 0, 0, 0.6);
    }
    
    .spinner {
      width: 16px;
      height: 16px;
      margin-right: 8px;
      border: 2px solid rgba(0, 0, 0, 0.1);
      border-top-color: var(--app-primary);
      border-radius: 50%;
      animation: spinner 0.8s linear infinite;
    }
    
    @keyframes spinner {
      to {
        transform: rotate(360deg);
      }
    }
    
    :host-context(.dark-theme) {
      .form-actions {
        border-top-color: rgba(255, 255, 255, 0.12);
      }
      
      .loading-indicator {
        color: rgba(255, 255, 255, 0.6);
      }
      
      .spinner {
        border-color: rgba(255, 255, 255, 0.1);
        border-top-color: var(--app-primary);
      }
    }
  `]
})
export class FormActionsComponent {
  @Input() showSubmit: boolean = true;
  @Input() submitLabel: string = 'Save';
  @Input() submitIcon: string = '';
  @Input() submitDisabled: boolean = false;
  
  @Input() showCancel: boolean = true;
  @Input() cancelLabel: string = 'Cancel';
  
  @Input() showDelete: boolean = false;
  @Input() deleteLabel: string = 'Delete';
  
  @Input() showSaveDraft: boolean = false;
  
  @Input() loading: boolean = false;
  @Input() loadingText: string = 'Processing...';
  
  @Input() centered: boolean = false;
  @Input() vertical: boolean = false;
  
  @Output() onSubmit = new EventEmitter<void>();
  @Output() onCancel = new EventEmitter<void>();
  @Output() onDelete = new EventEmitter<void>();
  @Output() onSaveDraft = new EventEmitter<void>();
  
  constructor(public iconService: IconService) {}
}