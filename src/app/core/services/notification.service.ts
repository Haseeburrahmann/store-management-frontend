// src/app/core/services/notification.service.ts
import { Injectable } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { Observable } from 'rxjs';

export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isWarning?: boolean;
  isError?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  constructor(
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  /**
   * Show a success notification
   * @param message The message to display
   * @param duration Duration in milliseconds
   */
  success(message: string, duration: number = 3000): void {
    this.showNotification(message, 'success-notification', duration);
  }

  /**
   * Show an error notification
   * @param message The message to display
   * @param duration Duration in milliseconds
   */
  error(message: string, duration: number = 5000): void {
    this.showNotification(message, 'error-notification', duration);
  }

  /**
   * Show a warning notification
   * @param message The message to display
   * @param duration Duration in milliseconds
   */
  warning(message: string, duration: number = 4000): void {
    this.showNotification(message, 'warning-notification', duration);
  }

  /**
   * Show an info notification
   * @param message The message to display
   * @param duration Duration in milliseconds
   */
  info(message: string, duration: number = 3000): void {
    this.showNotification(message, 'info-notification', duration);
  }

  /**
   * Show a confirmation dialog
   * @param data The dialog configuration data
   * @returns An observable that resolves to true if confirmed, false otherwise
   */
  confirm(data: ConfirmDialogData): Observable<boolean> {
    // We'll implement this with a dynamic import to avoid circular dependencies
    return new Observable<boolean>(observer => {
      import('../../shared/components/confirm-dialog/confirm-dialog.component').then(({ ConfirmDialogComponent }) => {
        const dialogRef = this.dialog.open(ConfirmDialogComponent, {
          width: '400px',
          data: {
            title: data.title,
            message: data.message,
            confirmText: data.confirmText || 'Confirm',
            cancelText: data.cancelText || 'Cancel',
            isWarning: data.isWarning || false,
            isError: data.isError || false
          }
        });

        dialogRef.afterClosed().subscribe(result => {
          observer.next(result === true);
          observer.complete();
        });
      });
    });
  }

  /**
   * Shows a custom notification with specific styling
   * @param message The message to display
   * @param panelClass CSS class to apply to the notification
   * @param duration Duration in milliseconds
   */
  private showNotification(message: string, panelClass: string, duration: number): void {
    const config: MatSnackBarConfig = {
      duration: duration,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: [panelClass]
    };

    this.snackBar.open(message, 'Close', config);
  }
}