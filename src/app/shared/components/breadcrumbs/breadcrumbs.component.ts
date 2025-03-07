// src/app/shared/components/breadcrumbs/breadcrumbs.component.ts
import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, NavigationEnd, Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { filter, Subscription } from 'rxjs';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';

export interface Breadcrumb {
  label: string;
  url: string;
  icon?: string;
}

@Component({
  selector: 'app-breadcrumbs',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule],
  template: `
    <nav class="breadcrumbs" *ngIf="breadcrumbs.length > 0" aria-label="breadcrumb">
      <ol>
        <li *ngFor="let breadcrumb of displayedBreadcrumbs; let last = last" 
            [class.active]="last">
          <a *ngIf="!last" [routerLink]="breadcrumb.url">
            <mat-icon *ngIf="breadcrumb.icon && !isMobile">{{ breadcrumb.icon }}</mat-icon>
            <span>{{ breadcrumb.label }}</span>
          </a>
          <span *ngIf="last">
            <mat-icon *ngIf="breadcrumb.icon && !isMobile">{{ breadcrumb.icon }}</mat-icon>
            <span>{{ breadcrumb.label }}</span>
          </span>
        </li>
      </ol>
    </nav>
  `,
  styles: [`
    .breadcrumbs {
      margin-bottom: 16px;
    }
    
    ol {
      display: flex;
      flex-wrap: wrap;
      list-style: none;
      margin: 0;
      padding: 0;
      align-items: center;
    }
    
    li {
      display: flex;
      align-items: center;
    }
    
    li:not(:last-child)::after {
      content: '/';
      margin: 0 8px;
      color: rgba(0, 0, 0, 0.38);
    }
    
    a {
      display: flex;
      align-items: center;
      text-decoration: none;
      color: var(--app-primary);
      font-size: 14px;
    }
    
    li.active {
      color: rgba(0, 0, 0, 0.87);
      font-size: 14px;
      display: flex;
      align-items: center;
    }
    
    mat-icon {
      font-size: 16px;
      height: 16px;
      width: 16px;
      margin-right: 4px;
    }
    
    :host-context(.dark-theme) {
      li:not(:last-child)::after {
        color: rgba(255, 255, 255, 0.38);
      }
      
      li.active {
        color: rgba(255, 255, 255, 0.87);
      }
    }
  `]
})
export class BreadcrumbsComponent implements OnInit, OnDestroy {
  @Input() breadcrumbs: Breadcrumb[] = [];
  
  displayedBreadcrumbs: Breadcrumb[] = [];
  isMobile = false;
  private maxDisplayed = 4;
  private subscriptions = new Subscription();
  
  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private breakpointObserver: BreakpointObserver
  ) {}
  
  ngOnInit(): void {
    // If no breadcrumbs are provided, try to build them from the route
    if (this.breadcrumbs.length === 0) {
      this.buildBreadcrumbs();
      
      // Rebuild breadcrumbs on navigation changes
      this.subscriptions.add(
        this.router.events.pipe(
          filter(event => event instanceof NavigationEnd)
        ).subscribe(() => {
          this.buildBreadcrumbs();
        })
      );
    } else {
      this.updateDisplayedBreadcrumbs();
    }
    
    // Detect screen size changes
    this.subscriptions.add(
      this.breakpointObserver.observe([
        Breakpoints.XSmall,
        Breakpoints.Small,
      ]).subscribe(result => {
        this.isMobile = result.matches;
        this.maxDisplayed = this.isMobile ? 3 : 4;
        this.updateDisplayedBreadcrumbs();
      })
    );
  }
  
  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
  
  private buildBreadcrumbs(): void {
    const builtBreadcrumbs: Breadcrumb[] = [];
    let currentRoute: ActivatedRoute = this.activatedRoute.root;
    let url = '';
    
    // Home breadcrumb
    builtBreadcrumbs.push({
      label: 'Home',
      url: '/',
      icon: 'home'
    });
    
    // Process route data to build breadcrumbs
    while (currentRoute.children.length) {
      const childRoute = currentRoute.firstChild;
      if (!childRoute) break;
      currentRoute = childRoute;
      
      // Skip if no route data or breadcrumb data
      if (!currentRoute.snapshot.data || !currentRoute.snapshot.data['breadcrumb']) {
        continue;
      }
      
      // Get breadcrumb data from route
      const breadcrumbData = currentRoute.snapshot.data['breadcrumb'];
      
      // Build URL
      if (currentRoute.snapshot.url.length) {
        url += `/${currentRoute.snapshot.url.map(segment => segment.path).join('/')}`;
      }
      
      // Add breadcrumb
      builtBreadcrumbs.push({
        label: typeof breadcrumbData === 'string' ? breadcrumbData : breadcrumbData.label,
        url: url,
        icon: typeof breadcrumbData === 'string' ? undefined : breadcrumbData.icon
      });
    }
    
    this.breadcrumbs = builtBreadcrumbs;
    this.updateDisplayedBreadcrumbs();
  }
  
  private updateDisplayedBreadcrumbs(): void {
    if (this.breadcrumbs.length <= this.maxDisplayed) {
      this.displayedBreadcrumbs = [...this.breadcrumbs];
      return;
    }
    
    // If we have more breadcrumbs than we can display, show first, ellipsis, and last few
    const lastItems = this.breadcrumbs.slice(-Math.floor(this.maxDisplayed / 2));
    
    this.displayedBreadcrumbs = [
      this.breadcrumbs[0],
      { label: '...', url: '', icon: undefined },
      ...lastItems
    ];
  }
}