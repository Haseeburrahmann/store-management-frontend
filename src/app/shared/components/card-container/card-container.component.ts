// src/app/shared/components/card-container/card-container.component.ts
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { IconService } from '../../../core/services/icon.service';

@Component({
  selector: 'app-card-container',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule],
  template: `
    <mat-card [class]="'card-container ' + (fullWidth ? 'full-width' : '')">
      <mat-card-header *ngIf="hasHeader">
        <div *ngIf="icon" mat-card-avatar class="card-icon">
          <mat-icon>{{ icon }}</mat-icon>
        </div>
        <mat-card-title>{{ title }}</mat-card-title>
        <mat-card-subtitle *ngIf="subtitle">{{ subtitle }}</mat-card-subtitle>
        <div class="spacer"></div>
        <button
          *ngIf="showRefresh"
          mat-icon-button
          (click)="onRefresh.emit()"
          aria-label="Refresh"
        >
          <mat-icon>{{ iconService.getActionIcon('refresh') }}</mat-icon>
        </button>
        <ng-content select="[card-actions]"></ng-content>
      </mat-card-header>
      
      <mat-card-content [class.has-padding]="padding">
        <ng-content></ng-content>
      </mat-card-content>
      
      <mat-card-actions *ngIf="hasFooter" align="end">
        <ng-content select="[card-footer]"></ng-content>
      </mat-card-actions>
    </mat-card>
  `,
  styles: [`
    .card-container {
      margin-bottom: 24px;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }
    
    .card-container.full-width {
      width: 100%;
    }
    
    .card-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: var(--app-primary);
      color: white;
      border-radius: 50%;
      width: 40px;
      height: 40px;
    }
    
    mat-card-header {
      padding: 16px 16px 0;
      display: flex;
      align-items: center;
    }
    
    mat-card-title {
      font-size: 18px;
      font-weight: 500;
      margin-bottom: 8px;
    }
    
    mat-card-subtitle {
      font-size: 14px;
    }
    
    .spacer {
      flex: 1;
    }
    
    mat-card-content {
      padding-top: 16px;
    }
    
    mat-card-content.has-padding {
      padding: 16px;
    }
    
    mat-card-actions {
      padding: 8px 16px 16px;
      margin: 0;
    }
    
    :host-context(.dark-theme) {
      .card-container {
        background-color: var(--app-surface);
        color: var(--app-text);
      }
    }
  `]
})
export class CardContainerComponent {
  @Input() title: string = '';
  @Input() subtitle: string = '';
  @Input() icon: string = '';
  @Input() padding: boolean = true;
  @Input() fullWidth: boolean = false;
  @Input() showRefresh: boolean = false;
  @Input() hasHeader: boolean = true;
  @Input() hasFooter: boolean = false;
  
  // Events
  onRefresh = new EventEmitter<void>();
  
  constructor(public iconService: IconService) {}
}

import { EventEmitter, Output } from '@angular/core';