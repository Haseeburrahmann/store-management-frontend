import { Component, Input, Output, EventEmitter, ViewChild, OnInit, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';

@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule
  ],
  template: `
    <div class="table-container">
      <div class="table-header" *ngIf="showFilter">
      <mat-form-field appearance="outline">
  <mat-label>Filter</mat-label>
  <input matInput #filterInput (keyup)="applyFilter($event)" placeholder="Filter data">
  <mat-icon matSuffix>search</mat-icon>
</mat-form-field>
      </div>
      
      <table mat-table [dataSource]="dataSource" matSort class="mat-elevation-z0">
        
        <!-- Dynamic columns based on the column definitions -->
        <ng-container *ngFor="let column of columns" [matColumnDef]="column.name">
          <!-- Header cell -->
          <th mat-header-cell *matHeaderCellDef mat-sort-header [disabled]="!column.sortable">
            {{ column.label }}
          </th>
          
          <!-- Regular cell -->
          <td mat-cell *matCellDef="let row">
            <!-- Different cell content based on column type -->
            <ng-container [ngSwitch]="column.type">
              
              <!-- Date column -->
              <span *ngSwitchCase="'date'">
                {{ row[column.name] | date: column.format || 'MMM d, y' }}
              </span>
              
              <!-- Boolean column -->
              <span *ngSwitchCase="'boolean'">
                <mat-icon *ngIf="row[column.name]" color="primary">check_circle</mat-icon>
                <mat-icon *ngIf="!row[column.name]" color="warn">cancel</mat-icon>
              </span>
              
              <!-- Status column -->
              <span *ngSwitchCase="'status'" class="status-badge" [ngClass]="'status-' + row[column.name]">
                {{ row[column.name] }}
              </span>
              
              <!-- Actions column -->
              <div *ngSwitchCase="'actions'" class="actions-cell">
                <button mat-icon-button [matMenuTriggerFor]="menu" aria-label="Actions">
                  <mat-icon>more_vert</mat-icon>
                </button>
                <mat-menu #menu="matMenu">
                  <button mat-menu-item *ngIf="showViewAction" (click)="onView(row)">
                    <mat-icon>visibility</mat-icon>
                    <span>View</span>
                  </button>
                  <button mat-menu-item *ngIf="showEditAction" (click)="onEdit(row)">
                    <mat-icon>edit</mat-icon>
                    <span>Edit</span>
                  </button>
                  <button mat-menu-item *ngIf="showDeleteAction" (click)="onDelete(row)">
                    <mat-icon>delete</mat-icon>
                    <span>Delete</span>
                  </button>
                  <ng-content select="[extraActions]"></ng-content>
                </mat-menu>
              </div>
              
              <!-- Default column (text) -->
              <span *ngSwitchDefault>{{ row[column.name] }}</span>
              
            </ng-container>
          </td>
        </ng-container>
        
        <!-- Empty state -->
        <tr class="mat-row" *matNoDataRow>
  <td class="mat-cell empty-table" [attr.colspan]="columns.length">
    <div *ngIf="getFilterValue(); else noData">
      No data matching the filter "{{getFilterValue()}}"
    </div>
    <ng-template #noData>
      <div>{{ emptyMessage }}</div>
    </ng-template>
  </td>
</tr>
        
        <!-- Table header and rows -->
        <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
        <tr 
          mat-row 
          *matRowDef="let row; columns: displayedColumns;"
          [ngClass]="{'clickable-row': rowClickable}"
          (click)="onRowClick(row)"
        ></tr>
      </table>
      
      <mat-paginator 
        *ngIf="showPaginator"
        [pageSizeOptions]="pageSizeOptions" 
        [pageSize]="pageSize"
        showFirstLastButtons
        aria-label="Select page">
      </mat-paginator>
    </div>
  `,
  styles: [`
    .table-container {
      width: 100%;
      overflow: auto;
    }
    
    .table-header {
      margin-bottom: 16px;
    }
    
    .mat-form-field {
      width: 100%;
      max-width: 500px;
    }
    
    table {
      width: 100%;
    }
    
    .clickable-row {
      cursor: pointer;
    }
    
    .clickable-row:hover {
      background-color: rgba(0, 0, 0, 0.04);
    }
    
    .empty-table {
      padding: 48px 0;
      text-align: center;
      color: #666;
      font-style: italic;
    }
    
    .status-badge {
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 12px;
      text-transform: capitalize;
    }
    
    .status-active {
      background-color: #e8f5e9;
      color: #2e7d32;
    }
    
    .status-pending {
      background-color: #fff8e1;
      color: #f57f17;
    }
    
    .status-inactive,
    .status-terminated {
      background-color: #ffebee;
      color: #c62828;
    }
    
    .status-on_leave {
      background-color: #e3f2fd;
      color: #1565c0;
    }
    
    .status-approved {
      background-color: #e8f5e9;
      color: #2e7d32;
    }
    
    .status-rejected {
      background-color: #ffebee;
      color: #c62828;
    }
  `]
})
export class DataTableComponent implements OnInit {
[x: string]: any;
  @Input() columns: Array<{
    name: string;
    label: string;
    type?: 'text' | 'date' | 'boolean' | 'status' | 'actions';
    format?: string;
    sortable?: boolean;
  }> = [];
  
  @Input() data: any[] = [];
  @Input() showFilter = true;
  @Input() showPaginator = true;
  @Input() pageSize = 10;
  @Input() pageSizeOptions: number[] = [5, 10, 25, 50];
  @Input() emptyMessage = 'No data available';
  @Input() rowClickable = false;
  
  @Input() showViewAction = true;
  @Input() showEditAction = true;
  @Input() showDeleteAction = true;
  
  @Output() rowClick = new EventEmitter<any>();
  @Output() viewItem = new EventEmitter<any>();
  @Output() editItem = new EventEmitter<any>();
  @Output() deleteItem = new EventEmitter<any>();
  
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  
  dataSource = new MatTableDataSource<any>([]);
  displayedColumns: string[] = [];
  
  ngOnInit() {
    // Set displayed columns from column definitions
    this.displayedColumns = this.columns.map(col => col.name);
    
    // Initialize data source
    this.dataSource = new MatTableDataSource(this.data);
  }
  
  ngAfterViewInit() {
    // Connect paginator and sort to data source
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }
  
  ngOnChanges() {
    // Update data when input changes
    if (this.dataSource) {
      this.dataSource.data = this.data;
    }
  }
  
  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
    
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }
  
  onRowClick(row: any) {
    if (this.rowClickable) {
      this.rowClick.emit(row);
    }
  }
  
  onView(row: any) {
    this.viewItem.emit(row);
  }
  
  onEdit(row: any) {
    this.editItem.emit(row);
  }
  
  onDelete(row: any) {
    this.deleteItem.emit(row);
  }

  getFilterValue(): string {
    return this['filterInput']?.nativeElement?.value || '';
  }
}