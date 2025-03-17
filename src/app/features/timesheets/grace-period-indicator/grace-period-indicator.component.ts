// src/app/shared/components/grace-period-indicator/grace-period-indicator.component.ts
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TimesheetUtils } from '../../../shared/models/hours.model';

@Component({
  selector: 'app-grace-period-indicator',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex items-center">
      <div class="flex-shrink-0 w-2 h-2 rounded-full mr-2" [ngClass]="getColorClass()"></div>
      <div class="text-xs" [ngClass]="getTextClass()">
        <ng-container *ngIf="remainingDays > 0">
          {{ remainingDays }} day{{ remainingDays === 1 ? '' : 's' }} remaining
        </ng-container>
        <ng-container *ngIf="remainingDays <= 0">
          Grace period expired
        </ng-container>
      </div>
    </div>
  `
})
export class GracePeriodIndicatorComponent {
  @Input() weekEndDate: string | Date = '';
  @Input() remainingDays = 0;
  
  ngOnInit() {
    // Calculate remaining days if not explicitly provided
    if (this.weekEndDate && this.remainingDays === 0) {
      this.remainingDays = TimesheetUtils.getRemainingGracePeriodDays(this.weekEndDate);
    }
  }
  
  getColorClass(): string {
    if (this.remainingDays <= 0) {
      return 'bg-red-600 dark:bg-red-400';
    } else if (this.remainingDays <= 3) {
      return 'bg-red-500 dark:bg-red-400';
    } else if (this.remainingDays <= 7) {
      return 'bg-yellow-500 dark:bg-yellow-400';
    } else {
      return 'bg-green-500 dark:bg-green-400';
    }
  }
  
  getTextClass(): string {
    if (this.remainingDays <= 0) {
      return 'text-red-600 dark:text-red-400';
    } else if (this.remainingDays <= 3) {
      return 'text-red-500 dark:text-red-400';
    } else if (this.remainingDays <= 7) {
      return 'text-yellow-500 dark:text-yellow-400';
    } else {
      return 'text-[var(--text-secondary)]';
    }
  }
}