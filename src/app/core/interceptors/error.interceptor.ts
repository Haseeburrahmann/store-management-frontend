// src/app/core/interceptors/error.interceptor.ts
import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError } from 'rxjs/operators';
import { ErrorService } from '../services/error.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const errorService = inject(ErrorService);
  const router = inject(Router);
  
  return next(req).pipe(
    catchError(error => {
      // Handle specific HTTP error cases
      if (error.status === 401) {
        // Unauthorized - redirect to login
        // Clear token
        localStorage.removeItem('auth_token');
        router.navigate(['/auth/login'], {
          queryParams: { returnUrl: router.routerState.snapshot.url }
        });
      }
      
      // Let the error service handle the rest
      return errorService.handleError(error);
    })
  );
};