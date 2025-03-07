// src/app/shared/components/loading/loading-indicator.component.ts

import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-loading-indicator',
  standalone: true,
  imports: [
    CommonModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div 
      class="loading-container"
      [class.loading-overlay]="overlay"
      [class.loading-fullpage]="fullPage"
      [class.loading-transparent]="transparent"
      [style.height]="height"
      [style.min-height]="minHeight"
    >
      <div class="spinner-container">
        <mat-spinner [diameter]="diameter" [color]="color"></mat-spinner>
        <div *ngIf="message" class="loading-message">{{ message }}</div>
      </div>
    </div>
  `,
  styles: [`
    .loading-container {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      width: 100%;
    }

    .loading-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(255, 255, 255, 0.7);
      z-index: 100;
    }

    .loading-fullpage {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 9999;
      background-color: rgba(255, 255, 255, 0.9);
    }

    .loading-transparent {
      background-color: transparent;
    }

    .spinner-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }

    .loading-message {
      margin-top: 16px;
      font-size: 16px;
      color: rgba(0, 0, 0, 0.7);
      text-align: center;
    }
  `]
})
export class LoadingIndicatorComponent {
  @Input() diameter = 40;
  @Input() overlay = false;
  @Input() transparent = false;
  @Input() fullPage = false;
  @Input() color: 'primary' | 'accent' | 'warn' = 'primary';
  @Input() message: string = '';
  @Input() height: string = 'auto';
  @Input() minHeight: string = '200px';
}