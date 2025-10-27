import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { DashboardStats, Transaction, Alert, CustomerProfile, Account } from '../models/dashboard.models';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private readonly API_URL = `${environment.apiUrl}`;

  constructor(private http: HttpClient) {}

  // Dashboard Statistics
  getDashboardStats(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(`${this.API_URL}/customer/dashboard/stats`, this.getHttpOptions());
  }

  // Customer Profile
  getCustomerProfile(): Observable<CustomerProfile> {
    return this.http.get<CustomerProfile>(`${this.API_URL}/customer/profile`, this.getHttpOptions());
  }

  updateCustomerProfile(profile: Partial<CustomerProfile>): Observable<CustomerProfile> {
    return this.http.put<CustomerProfile>(`${this.API_URL}/customer/profile`, profile, this.getHttpOptions());
  }

  // Accounts
  getCustomerAccounts(): Observable<Account[]> {
    return this.http.get<Account[]>(`${this.API_URL}/customer/accounts`, this.getHttpOptions());
  }

  getAccountById(accountId: number): Observable<Account> {
    return this.http.get<Account>(`${this.API_URL}/customer/accounts/${accountId}`, this.getHttpOptions());
  }

  // Transactions
  getRecentTransactions(limit: number = 10): Observable<Transaction[]> {
    return this.http.get<Transaction[]>(`${this.API_URL}/customer/transactions/recent?limit=${limit}`, this.getHttpOptions());
  }

  getAllTransactions(page: number = 0, size: number = 20): Observable<{content: Transaction[], totalElements: number}> {
    return this.http.get<{content: Transaction[], totalElements: number}>(`${this.API_URL}/customer/transactions?page=${page}&size=${size}`, this.getHttpOptions());
  }

  getTransactionById(transactionId: number): Observable<Transaction> {
    return this.http.get<Transaction>(`${this.API_URL}/customer/transactions/${transactionId}`, this.getHttpOptions());
  }

  // Alerts
  getRecentAlerts(limit: number = 10): Observable<Alert[]> {
    return this.http.get<Alert[]>(`${this.API_URL}/customer/alerts/recent?limit=${limit}`, this.getHttpOptions());
  }

  getAllAlerts(page: number = 0, size: number = 20): Observable<{content: Alert[], totalElements: number}> {
    return this.http.get<{content: Alert[], totalElements: number}>(`${this.API_URL}/customer/alerts?page=${page}&size=${size}`, this.getHttpOptions());
  }

  getAlertById(alertId: number): Observable<Alert> {
    return this.http.get<Alert>(`${this.API_URL}/customer/alerts/${alertId}`, this.getHttpOptions());
  }

  // KYC Document Upload
  uploadKycDocument(file: File, documentType: string): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentType', documentType);
    
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.getToken()}`
    });
    
    return this.http.post(`${this.API_URL}/customer/kyc/upload`, formData, { headers });
  }

  getKycDocuments(): Observable<any[]> {
    return this.http.get<any[]>(`${this.API_URL}/customer/kyc/documents`, this.getHttpOptions());
  }

  // Helper methods
  private getHttpOptions() {
    const token = this.getToken();
    return {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
      })
    };
  }

  private getToken(): string | null {
    return localStorage.getItem('token');
  }
}
