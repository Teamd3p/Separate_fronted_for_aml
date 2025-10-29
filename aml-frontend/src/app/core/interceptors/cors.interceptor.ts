import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  
  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Add authorization header if token exists
    const token = this.authService.getToken();
    let authRequest = req;
    
    if (token) {
      authRequest = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    }

    return next.handle(authRequest).pipe(
      catchError((error: HttpErrorResponse) => {
        // Handle 401 Unauthorized - token expired or invalid
        if (error.status === 401) {
          console.log('AuthInterceptor: 401 Unauthorized, redirecting to login');
          this.authService.logout();
          this.router.navigate(['/auth/login']);
          return throwError(() => error);
        }
        
        // Handle 403 Forbidden - insufficient permissions
        if (error.status === 403) {
          console.log('AuthInterceptor: 403 Forbidden, insufficient permissions');
          alert('You do not have permission to access this resource.');
          return throwError(() => error);
        }
        
        return throwError(() => error);
      })
    );
  }
}
