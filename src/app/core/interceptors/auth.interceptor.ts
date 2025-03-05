// src/app/core/interceptors/auth.interceptor.ts

import { HttpRequest, HttpHandlerFn, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { TokenService } from '../services/token.service';

export function authInterceptor(req: HttpRequest<any>, next: HttpHandlerFn): Observable<HttpEvent<any>> {
  const tokenService = inject(TokenService);  // Use TokenService instead of AuthService
  const router = inject(Router);

  const token = tokenService.getToken();

  if (token) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        console.log('Authentication error - redirecting to login');
        tokenService.removeToken();  // Just remove the token here
        router.navigate(['/login']);
      }

      let errorMessage = 'An error occurred';

      if (error.error instanceof ErrorEvent) {
        errorMessage = `Error: ${error.error.message}`;
      } else {
        if (error.error && error.error.detail) {
          errorMessage = error.error.detail;
        } else if (error.error && typeof error.error === 'string') {
          errorMessage = error.error;
        }  
        else if (error.error && typeof error.error === 'object') {
          // Try to extract a meaningful message
          errorMessage = JSON.stringify(error.error);
        }
        else if (error.status) {
          switch (error.status) {
            case 400:
              errorMessage = 'Bad request';
              break;
            case 403:
              errorMessage = 'Forbidden - You do not have permission to access this resource';
              break;
            case 404:
              errorMessage = 'Resource not found';
              break;
            case 500:
              errorMessage = 'Server error - Please try again later';
              break;
            default:
              errorMessage = `Error ${error.status}: ${error.statusText || 'Unknown error'}`;
          }
        }
      }

      return throwError(() => new Error(errorMessage));
    })
  );
}