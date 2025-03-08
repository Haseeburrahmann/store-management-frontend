import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-error-display',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <div *ngIf="visible" class="error-container" [ngClass]="type">
      <mat-icon>{{ getIcon() }}</mat-icon>
      <div class="error-content">
        <h4 *ngIf="title">{{ title }}</h4>
        <p>{{ message }}</p>
      </div>
    </div>
  `,
  styles: [`
    .error-container {
      display: flex;
      align-items: flex-start;
      margin: 16px 0;
      padding: 16px;
      border-radius: 4px;
      gap: 12px;
    }
    
    .error {
      background-color: #ffebee;
      color: #c62828;
    }
    
    .warning {
      background-color: #fff8e1;
      color: #f57f17;
    }
    
    .info {
      background-color: #e3f2fd;
      color: #1565c0;
    }
    
    .success {
      background-color: #e8f5e9;
      color: #2e7d32;
    }
    
    .error-content {
      flex: 1;
    }
    
    .error-content h4 {
      margin: 0 0 8px 0;
      font-weight: 500;
    }
    
    .error-content p {
      margin: 0;
    }
  `]
})
export class ErrorDisplayComponent {
  @Input() visible = true;
  @Input() type: 'error' | 'warning' | 'info' | 'success' = 'error';
  @Input() title = '';
  @Input() message = 'An error occurred';
  
  getIcon(): string {
    switch (this.type) {
      case 'error':
        return 'error';
      case 'warning':
        return 'warning';
      case 'info':
        return 'info';
      case 'success':
        return 'check_circle';
      default:
        return 'error';
    }
  }
}