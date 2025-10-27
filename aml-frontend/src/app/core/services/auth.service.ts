import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { LoginRequest, RegisterRequest, AuthResponse, VerifyOtpRequest } from '../models/auth.models';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_URL = `${environment.apiUrl}/auth`;
  private currentUserSubject = new BehaviorSubject<any>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
    // Check if user is already logged in
    const token = localStorage.getItem('token');
    if (token) {
      // You might want to validate the token here
      this.currentUserSubject.next({ token });
    }
  }

  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/login`, credentials, this.getHttpOptions())
      .pipe(
        tap(response => {
          if (response.success && response.token) {
            localStorage.setItem('token', response.token);
            localStorage.setItem('email', credentials.email);
            
            // Store additional user info if available in response
            if (response.user) {
              if (response.user.firstName) localStorage.setItem('firstName', response.user.firstName);
              if (response.user.lastName) localStorage.setItem('lastName', response.user.lastName);
              if (response.user.contactNumber) localStorage.setItem('contactNumber', response.user.contactNumber);
            }
            
            this.currentUserSubject.next({ 
              token: response.token, 
              email: credentials.email,
              user: response.user 
            });
          }
        })
      );
  }

  register(registerData: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/register`, registerData)
      .pipe(
        tap(response => {
          if (response.success) {
            // Store user registration data for later use
            localStorage.setItem('email', registerData.email);
            localStorage.setItem('firstName', registerData.firstName);
            localStorage.setItem('lastName', registerData.lastName);
            localStorage.setItem('contactNumber', registerData.contactNumber);
          }
        })
      );
  }

  verifyOtp(otpData: VerifyOtpRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/verify-otp`, otpData)
      .pipe(
        tap(response => {
          if (response.success && response.token) {
            localStorage.setItem('token', response.token);
            localStorage.setItem('email', response.email || '');
            localStorage.setItem('role', response.role || '');
            this.currentUserSubject.next(response);
          }
        })
      );
  }

  resendOtp(email: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/resend-otp?email=${email}`, {});
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('email');
    localStorage.removeItem('role');
    this.currentUserSubject.next(null);
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('token');
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  getCurrentUser(): any {
    return this.currentUserSubject.value;
  }

  private getHttpOptions() {
    const token = this.getToken();
    return {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
      })
    };
  }
}
