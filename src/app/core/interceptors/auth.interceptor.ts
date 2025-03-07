// src/app/core/interceptors/auth.interceptor.ts

import { HttpRequest, HttpHandlerFn, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { TokenService } from '../services/token.service';
import { createAppError, ErrorType } from '../utils/error-handler';

/**
 * HTTP interceptor to add authentication token to requests
 * and handle authentication errors
 * 
 * @param req The original request
 * @param next The next handler
 * @returns An observable of the HTTP event
 */
export function authInterceptor(req: HttpRequest<any>, next: HttpHandlerFn): Observable<HttpEvent<any>> {
  const tokenService = inject(TokenService);
  const router = inject(Router);

  const token = tokenService.getToken();

  // Add authorization header if token exists
  if (token) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Handle authentication errors (401)
      if (error.status === 401) {
        console.log('Authentication token expired - redirecting to login');
        tokenService.removeToken();
        
        // Navigate to login and preserve the attempted URL for redirect after login
        const returnUrl = router.url !== '/login' ? router.url : '';
        router.navigate(['/login'], returnUrl ? { queryParams: { returnUrl } } : {});
        
        // Create a standardized authentication error
        return throwError(() => createAppError({
          type: ErrorType.AUTHENTICATION,
          message: 'Your session has expired. Please log in again.'
        }));
      }

      // For other errors, pass them along to be handled by the services
      return throwError(() => error);
    })
  );
}