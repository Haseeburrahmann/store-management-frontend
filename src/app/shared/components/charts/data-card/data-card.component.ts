// src/app/shared/components/charts/data-card/data-card.component.ts
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-data-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="data-card" [ngClass]="'card-' + colorClass">
      <div class="card-header">
        <h3 class="card-title">{{ title }}</h3>
        <div class="card-icon">
          <i class="fas" [ngClass]="icon"></i>
        </div>
      </div>
      <div class="card-body">
        <div class="value-container">
          <span class="value">{{ valuePrefix }}{{ formatValue(value) }}{{ valueSuffix }}</span>
          <div *ngIf="showTrend && trend !== null" class="trend" [ngClass]="getTrendClass()">
            <i class="fas" [ngClass]="getTrendIcon()"></i>
            <span>{{ formatTrend(trend) }}</span>
          </div>
        </div>
        <p *ngIf="description" class="description">{{ description }}</p>
      </div>
    </div>
  `,
  styles: [`
    .data-card {
      background-color: white;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      overflow: hidden;
      height: 100%;
      display: flex;
      flex-direction: column;
    }
    
    .card-header {
      padding: 16px 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid rgba(0, 0, 0, 0.05);
    }
    
    .card-title {
      margin: 0;
      font-size: 1rem;
      font-weight: 500;
      color: #5a5c69;
    }
    
    .card-icon {
      width: 40px;
      height: 40px;
      display: flex;
      justify-content: center;
      align-items: center;
      border-radius: 50%;
      font-size: 1.2rem;
      color: white;
    }
    
    .card-body {
      padding: 20px;
      flex-grow: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }
    
    .value-container {
      display: flex;
      align-items: baseline;
      margin-bottom: 5px;
    }
    
    .value {
      font-size: 1.75rem;
      font-weight: 700;
      margin-right: 10px;
    }
    
    .trend {
      font-size: 0.9rem;
      display: flex;
      align-items: center;
      gap: 4px;
    }
    
    .trend-up {
      color: #1cc88a;
    }
    
    .trend-down {
      color: #e74a3b;
    }
    
    .trend-neutral {
      color: #858796;
    }
    
    .description {
      margin: 0;
      color: #858796;
      font-size: 0.875rem;
    }
    
    /* Card themes */
    .card-primary .card-icon {
      background-color: #4e73df;
    }
    
    .card-success .card-icon {
      background-color: #1cc88a;
    }
    
    .card-info .card-icon {
      background-color: #36b9cc;
    }
    
    .card-warning .card-icon {
      background-color: #f6c23e;
    }
    
    .card-danger .card-icon {
      background-color: #e74a3b;
    }
    
    .card-secondary .card-icon {
      background-color: #858796;
    }
  `]
})
export class DataCardComponent {
  @Input() title = '';
  @Input() value = 0;
  @Input() valuePrefix = '';
  @Input() valueSuffix = '';
  @Input() description = '';
  @Input() icon = 'fa-chart-line';
  @Input() colorClass = 'primary';
  @Input() trend: number | null = null;
  @Input() showTrend = true;
  @Input() formatDecimals = 0;
  @Input() useCompactNotation = true;

  /**
   * Format value for display (e.g. 1000 -> 1K)
   */
  formatValue(value: number): string {
    if (this.useCompactNotation && Math.abs(value) >= 1000) {
      return this.formatCompact(value);
    }
    
    return value.toLocaleString(undefined, {
      minimumFractionDigits: this.formatDecimals,
      maximumFractionDigits: this.formatDecimals
    });
  }

  /**
   * Format trend percentage
   */
  formatTrend(trend: number): string {
    const value = Math.abs(trend).toFixed(1);
    return `${value}%`;
  }

  /**
   * Get CSS class for trend display
   */
  getTrendClass(): string {
    if (!this.trend) return 'trend-neutral';
    return this.trend > 0 ? 'trend-up' : this.trend < 0 ? 'trend-down' : 'trend-neutral';
  }

  /**
   * Get icon for trend direction
   */
  getTrendIcon(): string {
    if (!this.trend) return 'fa-minus';
    return this.trend > 0 ? 'fa-arrow-up' : this.trend < 0 ? 'fa-arrow-down' : 'fa-minus';
  }

  /**
   * Format number in compact notation (e.g. 1000 -> 1K)
   */
  private formatCompact(value: number): string {
    const absValue = Math.abs(value);
    
    if (absValue >= 1000000000) {
      return (value / 1000000000).toFixed(1) + 'B';
    }
    
    if (absValue >= 1000000) {
      return (value / 1000000).toFixed(1) + 'M';
    }
    
    if (absValue >= 1000) {
      return (value / 1000).toFixed(1) + 'K';
    }
    
    return value.toFixed(this.formatDecimals);
  }
}