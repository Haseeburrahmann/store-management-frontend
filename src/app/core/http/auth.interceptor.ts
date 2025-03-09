// src/app/core/http/auth.interceptor.ts
import { HttpInterceptorFn } from '@angular/common/http';
import { tap } from 'rxjs/operators';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('token');
  
  // Log the request
  console.log(`Auth Interceptor: ${req.method} request to ${req.url}`);
  
  if (token) {
    console.log('Auth Interceptor: Token found, adding Authorization header');
    const cloned = req.clone({
      headers: req.headers.set('Authorization', `Bearer ${token}`)
    });
    
    // Return the request with response logging
    return next(cloned).pipe(
      tap(event => {
        if (event.type === 0) return; // Skip UploadProgress events
        console.log(`Auth Interceptor: Response from ${req.url}`, event);
      })
    );
  } else {
    console.log('Auth Interceptor: No token found, proceeding without Authorization header');
  }
  
  // Return the original request with response logging
  return next(req).pipe(
    tap(event => {
      if (event.type === 0) return; // Skip UploadProgress events
      console.log(`Auth Interceptor: Response from ${req.url}`, event);
    })
  );
};