// src/app/shared/components/page-header/page-header.component.ts
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
      <div class="header-left">
        <button 
          *ngIf="showBackButton" 
          mat-icon-button 
          class="back-button" 
          (click)="onBackClick()"
          aria-label="Go back">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <div class="title-container">
          <h1 class="page-title">{{ title }}</h1>
          <p *ngIf="subtitle" class="page-subtitle">{{ subtitle }}</p>
        </div>
      </div>
      <div class="header-actions">
        <ng-content></ng-content>
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
      border-bottom: 1px solid rgba(0,0,0,0.12);
    }
    
    .header-left {
      display: flex;
      align-items: center;
    }
    
    .back-button {
      margin-right: 16px;
    }
    
    .title-container {
      display: flex;
      flex-direction: column;
    }
    
    .page-title {
      margin: 0;
      font-size: 24px;
      font-weight: 500;
      color: var(--app-text);
    }
    
    .page-subtitle {
      margin: 4px 0 0;
      font-size: 14px;
      color: rgba(0,0,0,0.6);
    }
    
    .header-actions {
      display: flex;
      gap: 8px;
    }
    
    :host-context(.dark-theme) {
      .page-header {
        border-bottom-color: rgba(255,255,255,0.12);
      }
      
      .page-subtitle {
        color: rgba(255,255,255,0.7);
      }
    }
  `]
})
export class PageHeaderComponent {
  @Input() title: string = '';
  @Input() subtitle: string = '';
  @Input() showBackButton: boolean = false;
  @Input() backRoute: string | any[] = ['..'];

  constructor() {}

  onBackClick(): void {
    // The back navigation is handled by RouterModule and [routerLink]
    // This method is provided for potential future custom handling
  }
}