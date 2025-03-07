// src/app/shared/components/confirm-dialog/confirm-dialog.component.ts
import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  isWarning: boolean;
  isError: boolean;
}

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <div class="dialog-container" [ngClass]="{'warning': data.isWarning, 'error': data.isError}">
      <div class="dialog-header">
        <h2 mat-dialog-title>{{ data.title }}</h2>
        <mat-icon *ngIf="data.isWarning && !data.isError">warning</mat-icon>
        <mat-icon *ngIf="data.isError">error</mat-icon>
      </div>
      
      <mat-dialog-content>
        <p [innerHTML]="data.message"></p>
      </mat-dialog-content>
      
      <mat-dialog-actions align="end">
        <button mat-stroked-button [mat-dialog-close]="false">
          {{ data.cancelText }}
        </button>
        <button 
          mat-flat-button 
          [color]="data.isError ? 'warn' : (data.isWarning ? 'accent' : 'primary')"
          [mat-dialog-close]="true">
          {{ data.confirmText }}
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .dialog-container {
      min-width: 350px;
      max-width: 500px;
    }
    
    .dialog-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    
    .warning mat-icon {
      color: var(--app-warning);
    }
    
    .error mat-icon {
      color: var(--app-error);
    }
    
    mat-dialog-content {
      margin: 16px 0;
      max-height: 60vh;
      overflow-y: auto;
    }
    
    p {
      font-size: 16px;
      line-height: 1.5;
      margin: 0;
    }
    
    mat-dialog-actions {
      padding: 16px 0 0;
      margin-bottom: 0;
    }
    
    button {
      min-width: 100px;
    }
  `]
})
export class ConfirmDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmDialogData
  ) {}
}