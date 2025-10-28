import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class HttpClientService {
  private readonly API_URL = `${environment.apiUrl || 'http://localhost:8080/api'}`;

  constructor(private http: HttpClient) {}

  // GET request
  get<T>(endpoint: string, params?: HttpParams): Observable<T> {
    return this.http.get<T>(`${this.API_URL}${endpoint}`, {
      headers: this.getHeaders(),
      params,
      withCredentials: true
    }).pipe(
      retry(1),
      catchError(this.handleError)
    );
  }

  // POST request
  post<T>(endpoint: string, data: any): Observable<T> {
    return this.http.post<T>(`${this.API_URL}${endpoint}`, data, {
      headers: this.getHeaders(),
      withCredentials: true
    }).pipe(
      retry(1),
      catchError(this.handleError)
    );
  }

  // PUT request
  put<T>(endpoint: string, data: any): Observable<T> {
    return this.http.put<T>(`${this.API_URL}${endpoint}`, data, {
      headers: this.getHeaders(),
      withCredentials: true
    }).pipe(
      retry(1),
      catchError(this.handleError)
    );
  }

  // PATCH request
  patch<T>(endpoint: string, data: any): Observable<T> {
    return this.http.patch<T>(`${this.API_URL}${endpoint}`, data, {
      headers: this.getHeaders(),
      withCredentials: true
    }).pipe(
      retry(1),
      catchError(this.handleError)
    );
  }

  // DELETE request
  delete<T>(endpoint: string): Observable<T> {
    return this.http.delete<T>(`${this.API_URL}${endpoint}`, {
      headers: this.getHeaders(),
      withCredentials: true
    }).pipe(
      retry(1),
      catchError(this.handleError)
    );
  }

  private getHeaders(): HttpHeaders {
    const token = this.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
      'X-Requested-With': 'XMLHttpRequest'
    });
  }

  private getToken(): string | null {
    return localStorage.getItem('token');
  }

  private handleError(error: any): Observable<never> {
    console.error('HTTP Error:', error);
    
    if (error.status === 0) {
      console.error('CORS Error - Check backend CORS configuration');
    } else if (error.status === 401) {
      console.error('Unauthorized - Check authentication token');
      // Optionally redirect to login
    } else if (error.status === 403) {
      console.error('Forbidden - Check user permissions');
    }
    
    return throwError(() => error);
  }
}
