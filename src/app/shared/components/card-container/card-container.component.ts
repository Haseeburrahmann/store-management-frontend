import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-card-container',
  standalone: true,
  imports: [CommonModule, MatCardModule],
  template: `
    <mat-card class="card-container" [ngClass]="{'card-no-padding': noPadding}">
      <mat-card-header *ngIf="title || subtitle">
        <mat-card-title *ngIf="title">{{ title }}</mat-card-title>
        <mat-card-subtitle *ngIf="subtitle">{{ subtitle }}</mat-card-subtitle>
      </mat-card-header>
      
      <mat-card-content>
        <ng-content></ng-content>
      </mat-card-content>
      
      <mat-card-actions *ngIf="showActions" align="end">
        <ng-content select="[card-actions]"></ng-content>
      </mat-card-actions>
    </mat-card>
  `,
  styles: [`
    .card-container {
      margin-bottom: 20px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1) !important;
    }
    
    .card-no-padding .mat-card-content {
      padding: 0;
      margin: 0;
    }
    
    mat-card-header {
      margin-bottom: 16px;
    }
  `]
})
export class CardContainerComponent {
  @Input() title = '';
  @Input() subtitle = '';
  @Input() noPadding = false;
  @Input() showActions = false;
}