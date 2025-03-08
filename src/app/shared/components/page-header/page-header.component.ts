import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-page-header',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, RouterModule],
  template: `
    <div class="page-header">
      <div class="page-header-title">
        <h1>{{ title }}</h1>
        <p *ngIf="subtitle">{{ subtitle }}</p>
      </div>
      
      <div class="page-header-actions" *ngIf="showActions">
        <ng-content></ng-content>
        
        <button 
          *ngIf="showAddButton"
          mat-flat-button 
          color="primary" 
          [routerLink]="addButtonLink">
          <mat-icon>add</mat-icon>
          {{ addButtonText }}
        </button>
        
        <button 
          *ngIf="showBackButton"
          mat-stroked-button 
          [routerLink]="backButtonLink">
          <mat-icon>arrow_back</mat-icon>
          Back
        </button>
      </div>
    </div>
  `,
  styles: [`
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      padding-bottom: 16px;
      border-bottom: 1px solid #e0e0e0;
    }
    
    .page-header-title h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 500;
    }
    
    .page-header-title p {
      margin: 4px 0 0;
      color: #666;
    }
    
    .page-header-actions {
      display: flex;
      gap: 12px;
    }
  `]
})
export class PageHeaderComponent {
  @Input() title = '';
  @Input() subtitle = '';
  @Input() showAddButton = false;
  @Input() addButtonText = 'Add New';
  @Input() addButtonLink = '';
  @Input() showBackButton = false;
  @Input() backButtonLink = '';
  @Input() showActions = true;
}