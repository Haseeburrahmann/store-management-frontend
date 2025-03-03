import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap } from 'rxjs';
import { Router } from '@angular/router';
import { User, UserCreate, UserWithPermissions } from '../models/user.model';
import { environment } from '../../../../environments/environment';

interface AuthResponse {
  access_token: string;
  token_type: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;
  private userSubject = new BehaviorSubject<UserWithPermissions | null>(null);
  public user$ = this.userSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) {
    this.loadUser();
  }

  login(email: string, password: string): Observable<AuthResponse> {
    const formData = new FormData();
    formData.append('username', email);
    formData.append('password', password);
    
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, formData)
      .pipe(
        tap(response => {
          localStorage.setItem('access_token', response.access_token);
          this.loadUserProfile();
        })
      );
  }

  register(userData: UserCreate): Observable<User> {
    return this.http.post<User>(`${this.apiUrl}/register`, userData);
  }

  logout(): void {
    localStorage.removeItem('access_token');
    this.userSubject.next(null);
    this.router.navigate(['/login']);
  }

  loadUserProfile(): void {
    if (this.isAuthenticated()) {
      this.http.get<UserWithPermissions>(`${this.apiUrl}/me`)
        .subscribe({
          next: (user) => this.userSubject.next(user),
          error: () => {
            localStorage.removeItem('access_token');
            this.userSubject.next(null);
          }
        });
    }
  }

  public loadUser(): void {
    if (this.isAuthenticated()) {
      this.loadUserProfile();
    }
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('access_token');
  }

  getToken(): string | null {
    return localStorage.getItem('access_token');
  }

  public hasPermission(permission: string): boolean {
    const user = this.userSubject.value;
    if (!user || !user.permissions) {
      return false;
    }
    return user.permissions.includes(permission);
  }
}