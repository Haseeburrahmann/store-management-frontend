// src/app/features/navigation/navigation.component.ts
import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule, MatSidenav } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatBadgeModule } from '@angular/material/badge';
import { Subscription } from 'rxjs';

import { AuthService } from '../../core/services/auth.service';
import { UserWithPermissions } from '../../core/auth/models/user.model';
import { HoursService } from '../../core/services/hours.service';

interface NavItem {
  name: string;
  route?: string;
  icon: string;
  permission?: string;
  children?: NavItem[];
  badge?: number;
}

@Component({
  selector: 'app-navigation',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatSidenavModule,
    MatListModule,
    MatExpansionModule,
    MatMenuModule,
    MatDividerModule,
    MatTooltipModule,
    MatBadgeModule
  ],
  templateUrl: './navigation.component.html',
  styleUrls: ['./navigation.component.scss']
})
export class NavigationComponent implements OnInit, OnDestroy {
  @ViewChild('sidenav') sidenav!: MatSidenav;
  
  currentUser: UserWithPermissions | null = null;
  sidenavOpened = true;
  notificationCount = 0;
  
  navItems: NavItem[] = [
    {
      name: 'User Management',
      icon: 'people',
      permission: 'users:read',
      children: [
        { name: 'Users', route: '/users', icon: 'person', permission: 'users:read' },
        { name: 'Roles', route: '/roles', icon: 'security', permission: 'roles:read' }
      ]
    },
    {
      name: 'Store Management',
      icon: 'store',
      permission: 'stores:read',
      children: [
        { name: 'Stores', route: '/stores', icon: 'storefront', permission: 'stores:read' },
        { name: 'Employees', route: '/employees', icon: 'badge', permission: 'employees:read' }
      ]
    },
    {
      name: 'Hours & Timesheets',
      icon: 'schedule',
      permission: 'hours:read',
      badge: 0,
      children: [
        { name: 'Hours List', route: '/hours', icon: 'list', permission: 'hours:read' },
        { name: 'Clock In/Out', route: '/hours/clock', icon: 'timer', permission: 'hours:write' },
        { name: 'Approvals', route: '/hours/approval', icon: 'check_circle', permission: 'hours:approve', badge: 0 }
      ]
    },
    {
      name: 'Inventory',
      icon: 'inventory',
      permission: 'inventory:read',
      children: [
        { name: 'Inventory List', route: '/inventory', icon: 'list_alt', permission: 'inventory:read' },
        { name: 'Stock Requests', route: '/inventory/requests', icon: 'assignment', permission: 'stock_requests:read' }
      ]
    },
    {
      name: 'Sales',
      icon: 'point_of_sale',
      permission: 'sales:read',
      children: [
        { name: 'Sales Records', route: '/sales', icon: 'receipt', permission: 'sales:read' },
        { name: 'New Sale', route: '/sales/new', icon: 'add_shopping_cart', permission: 'sales:write' }
      ]
    },
    {
      name: 'Reports',
      route: '/reports',
      icon: 'bar_chart',
      permission: 'reports:read'
    },
    {
      name: 'My Profile',
      route: '/profile',
      icon: 'person',
      permission: 'hours:read'
    }
  ];
  
  filteredNavItems: NavItem[] = [...this.navItems];
  
  private userSubscription: Subscription | null = null;
  private pendingHoursSubscription: Subscription | null = null;
  
  constructor(
    private authService: AuthService,
    private hoursService: HoursService,
    private router: Router
  ) {}
  
  ngOnInit(): void {
    this.userSubscription = this.authService.user$.subscribe(user => {
      this.currentUser = user;
      this.loadPendingHoursCount();
    });
    
    // Adjust sidenav based on screen size
    this.checkScreenSize();
    window.addEventListener('resize', this.checkScreenSize.bind(this));
  }
  
  ngOnDestroy(): void {
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
    if (this.pendingHoursSubscription) {
      this.pendingHoursSubscription.unsubscribe();
    }
    window.removeEventListener('resize', this.checkScreenSize.bind(this));
  }
  
  loadPendingHoursCount(): void {
    if (!this.currentUser) return;
    
    // Only load pending hours if user is a manager or admin
    if (this.authService.hasPermission('hours', 'approve')) {
      this.pendingHoursSubscription = this.hoursService.getPendingApprovals().subscribe(hours => {
        const count = hours.length;
        this.updateBadgeCounts(count);
      });
    }
  }
  
  updateBadgeCounts(count: number): void {
    // Update Hours & Timesheets main menu badge
    const hoursMenu = this.navItems.find(item => item.name === 'Hours & Timesheets');
    if (hoursMenu) {
      hoursMenu.badge = count;
      
      // Update Approvals submenu badge
      const approvalsItem = hoursMenu.children?.find(child => child.name === 'Approvals');
      if (approvalsItem) {
        approvalsItem.badge = count;
      }
    }
    
    // Update notification count
    this.notificationCount = count;
    
    // Update filtered items
    this.filteredNavItems = [...this.navItems];
  }
  
  checkScreenSize(): void {
    if (window.innerWidth < 768) {
      this.sidenavOpened = false;
    } else {
      this.sidenavOpened = true;
    }
  }
  
  toggleSidenav(): void {
    this.sidenavOpened = !this.sidenavOpened;
  }
  
  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
  
  hasPermission(permission?: string): boolean {
    if (!permission) return true; // If no permission required, show the item
    
    if (!this.currentUser) return false;
    
    const [area, action] = permission.split(':');
    return this.authService.hasPermission(area, action);
  }
  
  getUserInitials(): string {
    if (!this.currentUser || !this.currentUser.full_name) return '';
    
    const names = this.currentUser.full_name.split(' ');
    if (names.length >= 2) {
      return (names[0][0] + names[1][0]).toUpperCase();
    } else if (names.length === 1) {
      return names[0][0].toUpperCase();
    }
    
    return '';
  }
  
  getUserRole(): string {
    if (!this.currentUser) return '';
    
    if (this.authService.hasPermission('users', 'approve')) {
      return 'Administrator';
    } else if (this.authService.hasPermission('employees', 'approve')) {
      return 'Store Manager';
    } else {
      return 'Employee';
    }
  }
  
  isPanelExpanded(item: NavItem): boolean {
    // Check if any children routes are active
    if (!item.children) return false;
    
    const currentUrl = this.router.url;
    return item.children.some(child => currentUrl.startsWith(child.route || ''));
  }
  
  filterNavItems(event: Event): void {
    const searchTerm = (event.target as HTMLInputElement).value.toLowerCase();
    
    if (!searchTerm) {
      this.filteredNavItems = [...this.navItems];
      return;
    }
    
    this.filteredNavItems = this.navItems.filter(item => {
      // Check if main item matches
      const mainMatch = item.name.toLowerCase().includes(searchTerm);
      
      // Check if any children match
      const childrenMatch = item.children?.some(child => 
        child.name.toLowerCase().includes(searchTerm)
      );
      
      return mainMatch || childrenMatch;
    });
  }
}