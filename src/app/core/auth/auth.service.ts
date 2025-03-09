// src/app/core/auth/auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { User } from '../../shared/models/user.model';
import { LoginResponse } from '../../shared/models/auth.model';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  
  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    this.loadUserFromStorage();
  }
  
  login(email: string, password: string): Observable<User> {
    const formData = new FormData();
    formData.append('username', email);
    formData.append('password', password);
    
    return this.http.post<LoginResponse>('/api/v1/auth/login', formData).pipe(
      tap(response => {
        localStorage.setItem('token', response.access_token);
      }),
      switchMap(() => this.fetchCurrentUser()),
      catchError(error => {
        console.error('Login error:', error);
        return throwError(() => new Error(error.error?.detail || 'Authentication failed'));
      })
    );
  }
  
  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.currentUserSubject.next(null);
    this.router.navigate(['/auth/login']);
  }
  
  register(userData: Partial<User>): Observable<User> {
    return this.http.post<User>('/api/v1/auth/register', userData);
  }
  
  fetchCurrentUser(): Observable<User> {
    return this.http.get<User>('/api/v1/auth/me').pipe(
      tap(user => {
        this.currentUserSubject.next(user);
        localStorage.setItem('user', JSON.stringify(user));
      }),
      catchError(error => {
        console.error('Error fetching user profile:', error);
        this.logout();
        return throwError(() => new Error('Failed to fetch user profile'));
      })
    );
  }
  
  private loadUserFromStorage(): void {
    const userJson = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (userJson && token) {
      try {
        const user = JSON.parse(userJson);
        this.currentUserSubject.next(user);
      } catch (e) {
        localStorage.removeItem('user');
      }
    }
  }
  
  get isAuthenticated(): boolean {
    return !!this.currentUserSubject.value && !!localStorage.getItem('token');
  }
  
  get currentUser(): User | null {
    return this.currentUserSubject.value;
  }
}