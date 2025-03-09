// src/app/core/http/api-url.interceptor.ts
import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export const apiUrlInterceptor: HttpInterceptorFn = (req, next) => {
  // Only prepend URL for relative paths and not for absolute URLs
  if (!req.url.startsWith('http') && !req.url.startsWith('https')) {
    return next(req.clone({
      url: `${environment.apiUrl}${req.url}`
    }));
  }
  
  return next(req);
};