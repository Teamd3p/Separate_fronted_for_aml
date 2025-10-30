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
          console.log('Login response:', response);
          if (response.success && response.token) {
            console.log('Storing token:', response.token);
            localStorage.setItem('token', response.token);
            localStorage.setItem('email', credentials.email);
            
            // Store additional user info if available in response
            if (response.user) {
              // Store both userId and customerId if available
              if (response.user.userId) {
                localStorage.setItem('userId', response.user.userId.toString());
                console.log('Stored user ID:', response.user.userId);
              } else if (response.user.id) {
                localStorage.setItem('userId', response.user.id.toString());
                console.log('Stored user ID:', response.user.id);
              }
              
              // Store customerId separately for KYC operations
              if (response.user.customerId) {
                localStorage.setItem('customerId', response.user.customerId.toString());
                console.log('Stored customer ID:', response.user.customerId);
              }
              
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
            
            if (response.user) {
              if (response.user.userId) {
                localStorage.setItem('userId', response.user.userId.toString());
                console.log('Stored user ID from OTP:', response.user.userId);
              } else if (response.user.id) {
                localStorage.setItem('userId', response.user.id.toString());
                console.log('Stored user ID from OTP:', response.user.id);
              }
              
              if (response.user.customerId) {
                localStorage.setItem('customerId', response.user.customerId.toString());
                console.log('Stored customer ID from OTP:', response.user.customerId);
              }
            }
            
            this.currentUserSubject.next(response);
          }
        })
      );
  }

  resendOtp(email: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/resend-otp?email=${email}`, {});
  }

  logout(): void {
    // Clear all stored user data
    localStorage.removeItem('token');
    localStorage.removeItem('email');
    localStorage.removeItem('role');
    localStorage.removeItem('userId');
    localStorage.removeItem('customerId');
    localStorage.removeItem('firstName');
    localStorage.removeItem('lastName');
    localStorage.removeItem('contactNumber');
    
    // Clear current user subject
    this.currentUserSubject.next(null);
    
    console.log('AuthService: User logged out, all data cleared');
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

  getUserRoleFromToken(): string | null {
    const token = this.getToken();
    console.log('Getting role from token:', token ? 'Token exists' : 'No token');
    
    if (!token) return null;

    try {
      // Decode JWT token (split by '.' and decode the payload)
      const payload = token.split('.')[1];
      const decodedPayload = JSON.parse(atob(payload));
      console.log('Decoded token payload:', decodedPayload);
      
      // Extract role from token payload
      const role = decodedPayload.role || decodedPayload.authorities?.[0] || null;
      console.log('Extracted role from token:', role);
      return role;
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
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
