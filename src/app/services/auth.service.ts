import { Injectable, inject, signal, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { tap } from 'rxjs/operators';
import { Observable } from 'rxjs';

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user_id: number;
  full_name: string;
  role: string;
}

export interface CurrentUser {
  id: number;
  full_name: string;
  role: string;
  email: string;
  specialty?: string;
}

const API_URL = '/api';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);

  // Signal reactivo con el usuario actual
  currentUser = signal<CurrentUser | null>(null);

  constructor() {
    // Restaurar sesión si existe token guardado
    if (isPlatformBrowser(this.platformId)) {
      const token = localStorage.getItem('token');
      if (token) {
        this.fetchMe().subscribe({ error: () => this.logout() });
      }
    }
  }

  login(email: string, password: string): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${API_URL}/auth/login/json`, { email, password })
      .pipe(
        tap((res) => {
          if (isPlatformBrowser(this.platformId)) {
            localStorage.setItem('token', res.access_token);
            localStorage.setItem('role', res.role);
          }
          this.currentUser.set({
            id: res.user_id,
            full_name: res.full_name,
            role: res.role,
            email,
          });
        })
      );
  }

  fetchMe(): Observable<CurrentUser> {
    return this.http.get<CurrentUser>(`${API_URL}/auth/me`).pipe(
      tap((user) => this.currentUser.set(user))
    );
  }

  logout(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('token');
      localStorage.removeItem('role');
    }
    this.currentUser.set(null);
    this.router.navigate(['/admin/login']);
  }

  getToken(): string | null {
    if (isPlatformBrowser(this.platformId)) {
      return localStorage.getItem('token');
    }
    return null;
  }

  isLoggedIn(): boolean {
    return this.currentUser() !== null;
  }

  hasRole(...roles: string[]): boolean {
    const user = this.currentUser();
    return user !== null && roles.includes(user.role);
  }
}
