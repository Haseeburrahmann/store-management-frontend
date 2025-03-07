// src/app/core/services/icon.service.ts
import { Injectable } from '@angular/core';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';

export interface AppIcon {
  name: string;
  path: string;
}

@Injectable({
  providedIn: 'root'
})
export class IconService {
  // Application-specific icons
  private appIcons: AppIcon[] = [
    { name: 'store', path: 'assets/icons/store.svg' },
    { name: 'employee', path: 'assets/icons/employee.svg' },
    { name: 'hours', path: 'assets/icons/hours.svg' },
    { name: 'inventory', path: 'assets/icons/inventory.svg' },
    { name: 'sales', path: 'assets/icons/sales.svg' },
    { name: 'reports', path: 'assets/icons/reports.svg' },
    { name: 'settings', path: 'assets/icons/settings.svg' },
    { name: 'dashboard', path: 'assets/icons/dashboard.svg' },
    { name: 'payment', path: 'assets/icons/payment.svg' },
    { name: 'user', path: 'assets/icons/user.svg' }
  ];

  // Common action icons with their material equivalents
  // This helps standardize icon usage across the application
  private actionIcons = {
    add: 'add',
    edit: 'edit',
    delete: 'delete',
    save: 'save',
    cancel: 'cancel',
    close: 'close',
    search: 'search',
    filter: 'filter_list',
    refresh: 'refresh',
    back: 'arrow_back',
    forward: 'arrow_forward',
    menu: 'menu',
    more: 'more_vert',
    check: 'check',
    error: 'error',
    warning: 'warning',
    info: 'info',
    help: 'help',
    settings: 'settings',
    person: 'person',
    people: 'people',
    lock: 'lock',
    unlock: 'lock_open',
    calendar: 'calendar_today',
    notification: 'notifications',
    download: 'download',
    upload: 'upload',
    print: 'print',
    send: 'send',
    view: 'visibility',
    hide: 'visibility_off',
    sort: 'sort',
    dashboard: 'dashboard',
    chart: 'insert_chart',
    list: 'list',
    grid: 'grid_view',
    home: 'home',
    clock: 'access_time',
    approval: 'thumb_up',
    rejection: 'thumb_down'
  };

  constructor(
    private matIconRegistry: MatIconRegistry,
    private domSanitizer: DomSanitizer
  ) {
    this.registerIcons();
  }

  private registerIcons(): void {
    // Register custom SVG icons
    this.appIcons.forEach(icon => {
      this.matIconRegistry.addSvgIcon(
        icon.name,
        this.domSanitizer.bypassSecurityTrustResourceUrl(icon.path)
      );
    });
  }

  /**
   * Gets the standardized icon name for a given action
   * @param action The action name
   * @returns The corresponding Material icon name
   */
  getActionIcon(action: keyof typeof this.actionIcons): string {
    return this.actionIcons[action] || 'help_outline';
  }

  /**
   * Gets icon with appropriate color class based on type
   * @param type The type of icon (primary, warning, etc.)
   * @param iconName The icon name
   * @returns Object with icon name and CSS class
   */
  getTypedIcon(type: 'primary' | 'success' | 'warning' | 'error' | 'info', iconName: string): { icon: string, class: string } {
    const classMap = {
      primary: 'text-primary',
      success: 'text-success',
      warning: 'text-warning',
      error: 'text-error',
      info: 'text-info'
    };
    
    return {
      icon: iconName,
      class: classMap[type]
    };
  }
}