// src/app/shared/components/data-table/data-table.component.ts
import { Component, Input, Output, EventEmitter, ViewChild, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatTable } from '@angular/material/table';
import { MatSortModule, MatSort, Sort } from '@angular/material/sort';
import { MatPaginatorModule, MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { SelectionModel } from '@angular/cdk/collections';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { IconService } from '../../../core/services/icon.service';

export interface TableColumn {
  name: string;       // Internal column name
  label: string;      // Display label
  property: string;   // Property path in data object
  type: 'text' | 'number' | 'date' | 'boolean' | 'icon' | 'custom'; // Column data type
  sortable?: boolean; // Whether column is sortable
  filterable?: boolean; // Whether column is filterable
  visible?: boolean;  // Whether column is visible
  sticky?: boolean;   // Whether column is sticky
  width?: string;     // Column width (e.g., '100px')
  align?: 'left' | 'center' | 'right'; // Text alignment
  format?: (value: any) => any; // Optional formatter function
  tooltip?: string;   // Tooltip for column header
  icon?: string;      // Icon for icon type columns
  iconColor?: string; // Icon color for icon type columns
}

@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatCheckboxModule
  ],
  template: `
    <div class="data-table-container">
      <!-- Loading spinner -->
      <div *ngIf="loading" class="loading-shade">
        <mat-spinner diameter="40"></mat-spinner>
      </div>
      
      <!-- Empty state -->
      <div *ngIf="!loading && data?.length === 0" class="empty-state">
        <mat-icon>{{ emptyStateIcon }}</mat-icon>
        <h3>{{ emptyStateMessage }}</h3>
        <p *ngIf="emptyStateDescription">{{ emptyStateDescription }}</p>
        <button 
          *ngIf="emptyStateAction" 
          mat-flat-button 
          color="primary" 
          (click)="emptyStateActionClick.emit()">
          {{ emptyStateAction }}
        </button>
      </div>
      
      <!-- Table -->
      <div class="table-wrapper" [class.empty]="!loading && data?.length === 0">
        <table mat-table 
               [dataSource]="data" 
               matSort 
               [matSortActive]="defaultSort.active"
               [matSortDirection]="defaultSort.direction"
               [matSortDisableClear]="true"
               (matSortChange)="onSortChange($event)"
               class="data-table">
          
          <!-- Selection column -->
          <ng-container *ngIf="selectable" matColumnDef="select">
            <th mat-header-cell *matHeaderCellDef>
              <mat-checkbox 
                [checked]="selection.hasValue() && isAllSelected()"
                [indeterminate]="selection.hasValue() && !isAllSelected()"
                (change)="$event ? masterToggle() : null">
              </mat-checkbox>
            </th>
            <td mat-cell *matCellDef="let row">
              <mat-checkbox 
                [checked]="selection.isSelected(row)"
                (change)="$event ? selection.toggle(row) : null"
                (click)="$event.stopPropagation()">
              </mat-checkbox>
            </td>
          </ng-container>
          
          <!-- Dynamic columns -->
          <ng-container *ngFor="let column of visibleColumns" [matColumnDef]="column.name">
            <!-- Header -->
            <th mat-header-cell 
                *matHeaderCellDef 
                [mat-sort-header]="column.sortable ? column.name : ''"
                [disabled]="!column.sortable"
                [style.width]="column.width || 'auto'"
                [style.text-align]="column.align || 'left'">
              {{ column.label }}
            </th>
            
            <!-- Cell -->
            <td mat-cell 
                *matCellDef="let element" 
                [style.text-align]="column.align || 'left'">
              
              <!-- Text -->
              <ng-container *ngIf="column.type === 'text'">
                {{ getValue(element, column) }}
              </ng-container>
              
              <!-- Number -->
              <ng-container *ngIf="column.type === 'number'">
                {{ getValue(element, column) | number }}
              </ng-container>
              
              <!-- Date -->
              <ng-container *ngIf="column.type === 'date'">
                {{ getValue(element, column) | date:'medium' }}
              </ng-container>
              
              <!-- Boolean -->
              <ng-container *ngIf="column.type === 'boolean'">
                <mat-icon *ngIf="getValue(element, column)">check</mat-icon>
                <mat-icon *ngIf="!getValue(element, column)">close</mat-icon>
              </ng-container>
              
              <!-- Icon -->
              <ng-container *ngIf="column.type === 'icon'">
                <mat-icon [style.color]="column.iconColor">
                  {{ column.icon || getValue(element, column) }}
                </mat-icon>
              </ng-container>
              
              <!-- Custom - Use content projection for custom cells -->
              <ng-container *ngIf="column.type === 'custom'">
                <!-- We'll use content projection instead of templateOutlet -->
                <span class="custom-cell-placeholder" [attr.data-column]="column.name" [attr.data-row-id]="element[trackBy]">
                  {{ getValue(element, column) }}
                </span>
              </ng-container>
            </td>
          </ng-container>
          
          <!-- Actions Column -->
          <ng-container *ngIf="showActions" matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef [style.width]="actionsColumnWidth">Actions</th>
            <td mat-cell *matCellDef="let element">
              <!-- Action Buttons -->
              <div class="action-buttons">
                <button *ngIf="actions.includes('view')" 
                      mat-icon-button 
                      color="primary"
                      (click)="onActionClick('view', element)"
                      matTooltip="View Details">
                  <mat-icon>{{ iconService.getActionIcon('view') }}</mat-icon>
                </button>
                
                <button *ngIf="actions.includes('edit')" 
                      mat-icon-button 
                      color="primary"
                      (click)="onActionClick('edit', element)"
                      matTooltip="Edit">
                  <mat-icon>{{ iconService.getActionIcon('edit') }}</mat-icon>
                </button>
                
                <button *ngIf="actions.includes('delete')" 
                      mat-icon-button 
                      color="warn"
                      (click)="onActionClick('delete', element)"
                      matTooltip="Delete">
                  <mat-icon>{{ iconService.getActionIcon('delete') }}</mat-icon>
                </button>
                
                <!-- More actions menu -->
                <button *ngIf="moreActions?.length" 
                      mat-icon-button 
                      [matMenuTriggerFor]="moreMenu">
                  <mat-icon>{{ iconService.getActionIcon('more') }}</mat-icon>
                </button>
                
                <mat-menu #moreMenu="matMenu">
                  <button *ngFor="let action of moreActions" 
                         mat-menu-item
                         (click)="onActionClick(action.value, element)">
                    <mat-icon *ngIf="action.icon">{{ action.icon }}</mat-icon>
                    <span>{{ action.label }}</span>
                  </button>
                </mat-menu>
              </div>
            </td>
          </ng-container>
          
          <tr mat-header-row *matHeaderRowDef="displayedColumns; sticky: stickyHeader"></tr>
          <tr mat-row 
              *matRowDef="let row; columns: displayedColumns;"
              [class.selected]="selection.isSelected(row)"
              (click)="onRowClick(row)"></tr>
        </table>
      </div>
      
      <!-- Pagination -->
      <mat-paginator *ngIf="showPagination"
                   [length]="totalItems"
                   [pageSize]="pageSize"
                   [pageSizeOptions]="pageSizeOptions"
                   [showFirstLastButtons]="true"
                   (page)="onPageChange($event)">
      </mat-paginator>
    </div>
  `,
  styles: [`
    .data-table-container {
      position: relative;
      width: 100%;
      overflow: hidden;
      border-radius: 4px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }
    
    .loading-shade {
      position: absolute;
      top: 0;
      left: 0;
      bottom: 0;
      right: 0;
      background: rgba(0, 0, 0, 0.05);
      z-index: 2;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .table-wrapper {
      overflow-x: auto;
      max-width: 100%;
    }
    
    .table-wrapper.empty {
      display: none;
    }
    
    .data-table {
      width: 100%;
    }
    
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px 20px;
      text-align: center;
    }
    
    .empty-state mat-icon {
      font-size: 48px;
      height: 48px;
      width: 48px;
      margin-bottom: 16px;
      color: rgba(0, 0, 0, 0.3);
    }
    
    .empty-state h3 {
      margin: 0 0 8px;
      font-size: 18px;
      font-weight: 500;
    }
    
    .empty-state p {
      margin: 0 0 16px;
      font-size: 14px;
      color: rgba(0, 0, 0, 0.6);
      max-width: 300px;
    }
    
    .action-buttons {
      display: flex;
      align-items: center;
    }
    
    tr.selected {
      background-color: rgba(var(--app-primary-rgb), 0.1);
    }
    
    :host-context(.dark-theme) {
      .empty-state mat-icon {
        color: rgba(255, 255, 255, 0.3);
      }
      
      .empty-state p {
        color: rgba(255, 255, 255, 0.6);
      }
      
      .loading-shade {
        background: rgba(255, 255, 255, 0.05);
      }
      
      tr.selected {
        background-color: rgba(var(--app-primary-rgb), 0.2);
      }
    }
  `]
})
export class DataTableComponent implements OnInit, OnChanges {
  @Input() data: any[] = [];
  @Input() columns: TableColumn[] = [];
  @Input() loading: boolean = false;
  @Input() showPagination: boolean = true;
  @Input() pageSize: number = 10;
  @Input() pageSizeOptions: number[] = [5, 10, 25, 50];
  @Input() totalItems: number = 0;
  @Input() stickyHeader: boolean = false;
  @Input() showActions: boolean = true;
  @Input() actions: string[] = ['view', 'edit', 'delete'];
  @Input() moreActions: {label: string, value: string, icon?: string}[] = [];
  @Input() actionsColumnWidth: string = '120px';
  @Input() selectable: boolean = false;
  @Input() trackBy: string = 'id';
  @Input() defaultSort: {
    active: string;
    direction: 'asc' | 'desc';
  } = { active: 'id', direction: 'desc' };
  
  @Input() emptyStateIcon: string = 'table_chart';
  @Input() emptyStateMessage: string = 'No data available';
  @Input() emptyStateDescription: string = '';
  @Input() emptyStateAction: string = '';
  
  @Output() rowClick = new EventEmitter<any>();
  @Output() actionClick = new EventEmitter<{action: string, item: any}>();
  @Output() sortChange = new EventEmitter<Sort>();
  @Output() pageChange = new EventEmitter<PageEvent>();
  @Output() selectionChange = new EventEmitter<any[]>();
  @Output() emptyStateActionClick = new EventEmitter<void>();
  
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatTable) table!: MatTable<any>;
  
  displayedColumns: string[] = [];
  visibleColumns: TableColumn[] = [];
  selection = new SelectionModel<any>(true, []);
  
  constructor(public iconService: IconService) {}
  
  ngOnInit(): void {
    this.updateVisibleColumns();
  }
  
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['columns']) {
      this.updateVisibleColumns();
    }
  }
  
  updateVisibleColumns(): void {
    this.visibleColumns = this.columns.filter(column => column.visible !== false);
    this.displayedColumns = [];
    
    if (this.selectable) {
      this.displayedColumns.push('select');
    }
    
    this.displayedColumns.push(...this.visibleColumns.map(column => column.name));
    
    if (this.showActions) {
      this.displayedColumns.push('actions');
    }
  }
  
  getValue(element: any, column: TableColumn): any {
    // Handle nested properties (e.g., 'user.name')
    const properties = column.property.split('.');
    let value = element;
    
    for (const prop of properties) {
      if (value === null || value === undefined) return '';
      value = value[prop];
    }
    
    // Apply formatter if provided
    if (column.format && typeof column.format === 'function') {
      return column.format(value);
    }
    
    return value;
  }
  
  onRowClick(row: any): void {
    if (!this.selectable) {
      this.rowClick.emit(row);
    }
  }
  
  onActionClick(action: string, item: any): void {
    this.actionClick.emit({ action, item });
  }
  
  onSortChange(sort: Sort): void {
    this.sortChange.emit(sort);
  }
  
  onPageChange(event: PageEvent): void {
    this.pageChange.emit(event);
  }
  
  /** Whether the number of selected elements matches the total number of rows. */
  isAllSelected(): boolean {
    const numSelected = this.selection.selected.length;
    const numRows = this.data.length;
    return numSelected === numRows;
  }

  /** Selects all rows if they are not all selected; otherwise clear selection. */
  masterToggle(): void {
    if (this.isAllSelected()) {
      this.selection.clear();
    } else {
      this.data.forEach(row => this.selection.select(row));
    }
    this.selectionChange.emit(this.selection.selected);
  }
}