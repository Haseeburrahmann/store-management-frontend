// src/app/shared/components/action-button/action-button.component.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { IconService } from '../../../core/services/icon.service';

export type ButtonStyle = 'default' | 'primary' | 'accent' | 'warn' | 'success' | 'info';
export type ButtonType = 'basic' | 'raised' | 'flat' | 'stroked' | 'icon' | 'fab' | 'miniFab';
export type ButtonSize = 'small' | 'medium' | 'large';

@Component({
  selector: 'app-action-button',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatTooltipModule],
  template: `
    <!-- Basic Button -->
    <button *ngIf="type === 'basic'"
            mat-button
            [color]="getMatColor()"
            [disabled]="disabled || loading"
            [matTooltip]="tooltip || ''"
            [class]="getButtonClasses()"
            (click)="onClick.emit($event)">
      <ng-container [ngTemplateOutlet]="buttonContent"></ng-container>
    </button>
    
    <!-- Raised Button -->
    <button *ngIf="type === 'raised'"
            mat-raised-button
            [color]="getMatColor()"
            [disabled]="disabled || loading"
            [matTooltip]="tooltip || ''"
            [class]="getButtonClasses()"
            (click)="onClick.emit($event)">
      <ng-container [ngTemplateOutlet]="buttonContent"></ng-container>
    </button>
    
    <!-- Flat Button -->
    <button *ngIf="type === 'flat'"
            mat-flat-button
            [color]="getMatColor()"
            [disabled]="disabled || loading"
            [matTooltip]="tooltip || ''"
            [class]="getButtonClasses()"
            (click)="onClick.emit($event)">
      <ng-container [ngTemplateOutlet]="buttonContent"></ng-container>
    </button>
    
    <!-- Stroked Button -->
    <button *ngIf="type === 'stroked'"
            mat-stroked-button
            [color]="getMatColor()"
            [disabled]="disabled || loading"
            [matTooltip]="tooltip || ''"
            [class]="getButtonClasses()"
            (click)="onClick.emit($event)">
      <ng-container [ngTemplateOutlet]="buttonContent"></ng-container>
    </button>
    
    <!-- Icon Button -->
    <button *ngIf="type === 'icon'"
            mat-icon-button
            [color]="getMatColor()"
            [disabled]="disabled || loading"
            [matTooltip]="tooltip || ''"
            [class]="getButtonClasses()"
            (click)="onClick.emit($event)">
      <mat-icon>{{ icon }}</mat-icon>
    </button>
    
    <!-- FAB Button -->
    <button *ngIf="type === 'fab'"
            mat-fab
            [color]="getMatColor()"
            [disabled]="disabled || loading"
            [matTooltip]="tooltip || ''"
            [class]="getButtonClasses()"
            (click)="onClick.emit($event)">
      <mat-icon>{{ icon }}</mat-icon>
    </button>
    
    <!-- Mini FAB Button -->
    <button *ngIf="type === 'miniFab'"
            mat-mini-fab
            [color]="getMatColor()"
            [disabled]="disabled || loading"
            [matTooltip]="tooltip || ''"
            [class]="getButtonClasses()"
            (click)="onClick.emit($event)">
      <mat-icon>{{ icon }}</mat-icon>
    </button>
    
    <!-- Template for button content -->
    <ng-template #buttonContent>
      <!-- Loading spinner -->
      <div *ngIf="loading" class="spinner"></div>
      
      <!-- Button Icon (if specified and not icon-only button) -->
      <mat-icon *ngIf="icon && !loading && type !== 'icon' && type !== 'fab' && type !== 'miniFab'">
        {{ icon }}
      </mat-icon>
      
      <!-- Button Text (if not icon-only button) -->
      <span *ngIf="type !== 'icon' && type !== 'fab' && type !== 'miniFab'" class="button-text">
        {{ label }}
      </span>
    </ng-template>
  `,
  styles: [`
    :host {
      display: inline-block;
    }
    
    .button-text {
      margin-left: 8px;
    }
    
    button.btn-small {
      font-size: 12px;
      line-height: 30px;
      padding: 0 8px;
    }
    
    button.btn-large {
      font-size: 16px;
      line-height: 48px;
      padding: 0 24px;
    }
    
    .spinner {
      display: inline-block;
      width: 18px;
      height: 18px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-radius: 50%;
      border-top-color: #fff;
      animation: spin 1s ease-in-out infinite;
      margin-right: 8px;
    }
    
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    
    /* Custom colors that aren't part of Material */
    button.btn-success {
      background-color: var(--app-success);
      color: white;
    }
    
    button.btn-info {
      background-color: var(--app-info);
      color: white;
    }
    
    /* For stroked buttons with custom colors */
    button.mat-stroked-button.btn-success {
      color: var(--app-success);
      border-color: var(--app-success);
      background-color: transparent;
    }
    
    button.mat-stroked-button.btn-info {
      color: var(--app-info);
      border-color: var(--app-info);
      background-color: transparent;
    }
  `]
})
export class ActionButtonComponent {
  @Input() label: string = '';
  @Input() icon: string = '';
  @Input() type: ButtonType = 'basic';
  @Input() style: ButtonStyle = 'default';
  @Input() size: ButtonSize = 'medium';
  @Input() disabled: boolean = false;
  @Input() loading: boolean = false;
  @Input() tooltip: string = '';
  
  @Output() onClick = new EventEmitter<MouseEvent>();
  
  constructor(private iconService: IconService) {}
  
  getMatColor(): string {
    // Map our styles to Material's color palette
    switch (this.style) {
      case 'primary': return 'primary';
      case 'accent': return 'accent';
      case 'warn': return 'warn';
      // For custom colors, we'll use CSS classes instead
      default: return '';
    }
  }
  
  getButtonClasses(): string {
    const classes: string[] = [];
    
    // Add size class
    if (this.size === 'small') {
      classes.push('btn-small');
    } else if (this.size === 'large') {
      classes.push('btn-large');
    }
    
    // Add custom color classes
    if (this.style === 'success') {
      classes.push('btn-success');
    } else if (this.style === 'info') {
      classes.push('btn-info');
    }
    
    return classes.join(' ');
  }
}