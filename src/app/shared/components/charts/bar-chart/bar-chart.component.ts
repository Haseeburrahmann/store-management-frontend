// src/app/shared/components/charts/bar-chart/bar-chart.component.ts
import { Component, Input, OnChanges, OnInit, SimpleChanges, ViewChild, ElementRef, Output, EventEmitter } from '@angular/core';
import { Chart, ChartConfiguration, ChartType } from 'chart.js/auto';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-bar-chart',
  standalone: true,
  imports: [NgClass],
  template: `
    <div class="chart-container" [ngClass]="{'loading': loading}">
      <div *ngIf="loading" class="chart-loader">
        <div class="spinner"></div>
      </div>
      <canvas #chartCanvas></canvas>
      <div *ngIf="showLegend" class="chart-legend">
        <div *ngFor="let item of legendItems; let i = index" class="legend-item">
          <span class="legend-color" [style.background-color]="item.color"></span>
          <span class="legend-label">{{ item.label }}</span>
        </div>
      </div>
      <div *ngIf="noDataAvailable" class="no-data-message">
        {{ noDataMessage }}
      </div>
    </div>
  `,
  styles: [`
    .chart-container {
      position: relative;
      width: 100%;
      height: 100%;
      min-height: 250px;
    }
    
    .chart-loader {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
      background-color: rgba(255, 255, 255, 0.7);
      z-index: 10;
    }
    
    .spinner {
      width: 40px;
      height: 40px;
      border: 4px solid rgba(0, 0, 0, 0.1);
      border-left-color: #09f;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    
    .chart-legend {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      margin-top: 10px;
    }
    
    .legend-item {
      display: flex;
      align-items: center;
      margin: 0 10px 5px 0;
    }
    
    .legend-color {
      display: inline-block;
      width: 12px;
      height: 12px;
      margin-right: 5px;
      border-radius: 2px;
    }
    
    .no-data-message {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
      color: #888;
      font-style: italic;
    }
  `]
})
export class BarChartComponent implements OnInit, OnChanges {
  @ViewChild('chartCanvas') chartCanvas!: ElementRef<HTMLCanvasElement>;
  @Input() data: any[] = [];
  @Input() labels: string[] = [];
  @Input() title: string = '';
  @Input() xAxisLabel: string = '';
  @Input() yAxisLabel: string = '';
  @Input() colors: string[] = ['#4e73df', '#1cc88a', '#36b9cc', '#f6c23e', '#e74a3b'];
  @Input() showLegend: boolean = true;
  @Input() horizontal: boolean = false;
  @Input() stacked: boolean = false;
  @Input() loading: boolean = false;
  @Input() noDataMessage: string = 'No data available';
  @Input() height: string = '300px';
  @Input() minValue?: number;
  @Input() maxValue?: number;
  @Input() datasetLabels: string[] = [];
  
  @Output() barClick = new EventEmitter<{
    index: number;
    datasetIndex: number;
    label: string;
    value: number;
  }>();

  private chart: Chart | null = null;
  legendItems: { color: string; label: string }[] = [];
  noDataAvailable: boolean = false;

  ngOnInit(): void {
    this.initChart();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (
      (changes['data'] || changes['labels'] || changes['colors']) && 
      this.chartCanvas && 
      this.chartCanvas.nativeElement
    ) {
      if (this.chart) {
        this.chart.destroy();
      }
      this.initChart();
    }
    
    if (changes['loading'] && !this.loading && this.chart) {
      this.updateChart();
    }
  }

  private initChart(): void {
    if (!this.chartCanvas) {
      return;
    }
    
    // Check if we have data
    this.noDataAvailable = !this.data || this.data.length === 0 || 
                           (Array.isArray(this.data[0]) && this.data[0].length === 0);
    
    if (this.noDataAvailable) {
      return;
    }
    
    const ctx = this.chartCanvas.nativeElement.getContext('2d');
    
    if (!ctx) {
      return;
    }
    
    // Format data for chart.js
    const datasets = Array.isArray(this.data[0]) 
      ? this.formatMultipleDatasets() 
      : this.formatSingleDataset();
      
    // Generate legend items
    this.legendItems = this.datasetLabels.map((label, index) => ({
      color: this.colors[index % this.colors.length],
      label: label
    }));
    
    const chartType: ChartType = this.horizontal ? 'bar' : 'bar';
    
    const config: ChartConfiguration = {
      type: chartType,
      data: {
        labels: this.labels,
        datasets: datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: this.horizontal ? 'y' : 'x',
        plugins: {
          legend: {
            display: false, // We handle legend separately
          },
          title: {
            display: !!this.title,
            text: this.title,
            font: {
              size: 16,
              weight: 'bold'
            }
          },
          tooltip: {
            mode: 'index',
            intersect: false,
          }
        },
        scales: {
          x: {
            title: {
              display: !!this.xAxisLabel,
              text: this.xAxisLabel
            },
            stacked: this.stacked,
            grid: {
              drawBorder: false,
              color: 'rgba(0, 0, 0, 0.05)'
            }
          },
          y: {
            title: {
              display: !!this.yAxisLabel,
              text: this.yAxisLabel
            },
            stacked: this.stacked,
            grid: {
              drawBorder: false,
              color: 'rgba(0, 0, 0, 0.05)'
            },
            min: this.minValue,
            max: this.maxValue
          }
        },
        onClick: (event, elements) => {
          if (elements.length > 0) {
            const firstElement = elements[0];
            this.barClick.emit({
              index: firstElement.index,
              datasetIndex: firstElement.datasetIndex,
              label: this.labels[firstElement.index],
              value: this.data[firstElement.datasetIndex][firstElement.index]
            });
          }
        }
      }
    };
    
    this.chart = new Chart(ctx, config);
  }

  private formatSingleDataset() {
    return [{
      data: this.data,
      backgroundColor: this.colors[0],
      borderColor: this.adjustColorBrightness(this.colors[0], -0.2),
      borderWidth: 1,
      label: this.datasetLabels[0] || 'Data'
    }];
  }

  private formatMultipleDatasets() {
    return this.data.map((dataset, index) => ({
      data: dataset,
      backgroundColor: this.colors[index % this.colors.length],
      borderColor: this.adjustColorBrightness(this.colors[index % this.colors.length], -0.2),
      borderWidth: 1,
      label: this.datasetLabels[index] || `Dataset ${index + 1}`
    }));
  }

  private updateChart(): void {
    if (this.chart) {
      this.chart.update();
    }
  }

  // Helper function to adjust color brightness
  private adjustColorBrightness(hex: string, percent: number): string {
    // Convert hex to RGB
    let r = parseInt(hex.substring(1, 3), 16);
    let g = parseInt(hex.substring(3, 5), 16);
    let b = parseInt(hex.substring(5, 7), 16);

    // Adjust brightness
    r = Math.round(r * (1 + percent));
    g = Math.round(g * (1 + percent));
    b = Math.round(b * (1 + percent));

    // Ensure values are within valid range
    r = Math.min(255, Math.max(0, r));
    g = Math.min(255, Math.max(0, g));
    b = Math.min(255, Math.max(0, b));

    // Convert back to hex
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }
}