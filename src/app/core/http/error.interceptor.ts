// src/app/core/http/error.interceptor.ts
import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  
  return next(req).pipe(
    catchError(error => {
      console.error(`Error Interceptor: Error in ${req.method} request to ${req.url}`, error);
      
      if (error.status === 401) {
        console.warn('Error Interceptor: Unauthorized (401) - User will be logged out');
        // Auto logout if 401 response returned from api
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.navigate(['/auth/login']);
      }
      
      const errorMessage = error.error?.detail || error.message || 'Unknown error occurred';
      console.error('Error Interceptor: Error message:', errorMessage);
      
      return throwError(() => new Error(errorMessage));
    })
  );
};