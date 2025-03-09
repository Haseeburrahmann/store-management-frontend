// src/app/shared/directives/has-permission.directive.ts
import { Directive, Input, OnInit, TemplateRef, ViewContainerRef, OnDestroy } from '@angular/core';
import { PermissionService } from '../../core/auth/permission.service';
import { Subscription } from 'rxjs';

/**
 * Directive to conditionally render elements based on user permissions
 * Usage: *appHasPermission="'users:read'" or *appHasPermission="['users:read', 'users:write']"
 */
@Directive({
  selector: '[appHasPermission]',
  standalone: true
})
export class HasPermissionDirective implements OnInit, OnDestroy {
  private subscription: Subscription | null = null;
  private hasView = false;
  private requiredPermissions: string[] = [];
  private checkType: 'any' | 'all' = 'all';
  
  @Input('appHasPermission') set appHasPermission(permission: string | string[]) {
    if (typeof permission === 'string') {
      this.requiredPermissions = [permission];
    } else {
      this.requiredPermissions = permission;
    }
  }
  
  @Input('appHasPermissionType') set appHasPermissionType(type: 'any' | 'all') {
    this.checkType = type;
  }
  
  constructor(
    private permissionService: PermissionService,
    private templateRef: TemplateRef<any>,
    private viewContainer: ViewContainerRef
  ) {}
  
  ngOnInit(): void {
    // Subscribe to permission changes to update view
    this.subscription = this.permissionService.userPermissions$.subscribe(() => {
      this.updateView();
    });
    
    // Initial update
    this.updateView();
  }
  
  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }
  
  private updateView(): void {
    const hasPermission = this.checkPermissions();
    
    if (hasPermission && !this.hasView) {
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.hasView = true;
    } else if (!hasPermission && this.hasView) {
      this.viewContainer.clear();
      this.hasView = false;
    }
  }
  
  private checkPermissions(): boolean {
    if (this.requiredPermissions.length === 0) {
      return true;
    }
    
    if (this.checkType === 'any') {
      return this.permissionService.hasAnyPermission(this.requiredPermissions);
    }
    
    return this.permissionService.hasAllPermissions(this.requiredPermissions);
  }
}