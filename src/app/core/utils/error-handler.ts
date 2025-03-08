import { ErrorHandler, Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ErrorService } from '../services/error.service';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  constructor(private errorService: ErrorService) {}

  handleError(error: any): void {
    // Handle different types of errors
    if (error instanceof HttpErrorResponse) {
      // HTTP errors are already handled by the error interceptor
      // But we can still log them for monitoring
      this.errorService.logError(error);
    } else {
      // Handle client-side errors (Angular errors, JS errors, etc.)
      const message = this.getClientErrorMessage(error);
      console.error('Application error:', message);
      this.errorService.logError({ message, originalError: error });
    }
  }

  private getClientErrorMessage(error: Error): string {
    if (!navigator.onLine) {
      return 'No internet connection';
    }
    
    return error.message ? error.message : error.toString();
  }
}