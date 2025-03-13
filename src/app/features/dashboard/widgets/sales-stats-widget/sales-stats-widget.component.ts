// src/app/features/dashboard/widgets/sales-stats-widget/sales-stats-widget.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-sales-stats-widget',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './sales-stats-widget.component.html'
})
export class SalesStatsWidgetComponent implements OnInit {
  loading = true;
  Math = Math; // For using Math in template
  
  // Sample data (in a real app, this would come from an API)
  todaySales = 12580.45;
  salesTrend = 5.2; // Percentage change
  
  weekSales = 87654.32;
  weekTrend = 3.7;
  
  monthSales = 345678.90;
  monthTrend = -2.1;
  
  topStores = [
    { name: 'Downtown Store', sales: 23456.78 },
    { name: 'West Mall', sales: 18765.43 },
    { name: 'East Side', sales: 15432.10 },
    { name: 'North Point', sales: 12345.67 }
  ];
  
  constructor() {}
  
  ngOnInit(): void {
    // Simulate loading data
    setTimeout(() => {
      this.loading = false;
    }, 1000);
  }
  
  formatCurrency(value: number): string {
    return value.toLocaleString('en-US', { 
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }
}