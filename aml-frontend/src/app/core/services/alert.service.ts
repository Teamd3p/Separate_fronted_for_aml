import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, forkJoin } from 'rxjs';
import { map, switchMap, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface AlertNotification {
  id: number;
  transactionId: string;
  amount: number;
  date: string;
  reason: string;
  status: 'PENDING' | 'RESOLVED' | 'FLAGGED' | 'CANCELED' | 'OPEN' | 'NEW' | 'CLOSED' | 'COMPLETED';
  type: 'FLAGGED' | 'CANCELED' | 'SUSPICIOUS';
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  description?: string;
  createdAt?: string;
}

export interface AlertStats {
  pending: number;
  resolved: number;
  total: number;
}

@Injectable({
  providedIn: 'root'
})
export class AlertService {
  private readonly API_URL = `${environment.apiUrl}`;

  constructor(private http: HttpClient) {}

  // Get all alerts for current customer
  getCustomerAlerts(): Observable<AlertNotification[]> {
    return this.http.get<any>(`${this.API_URL}/customers/alerts`, this.getHttpOptions()).pipe(
      switchMap((response: any) => {
        // Handle ApiResponseDto wrapper
        const alerts = response.data || response;
        if (Array.isArray(alerts) && alerts.length > 0) {
          // Fetch transaction amounts for each alert
          return this.enrichAlertsWithTransactionAmounts(alerts);
        }
        
        // Return sample data for testing when no real alerts exist
        return of(this.getSampleAlerts());
      })
    );
  }

  // Enrich alerts with transaction amounts
  private enrichAlertsWithTransactionAmounts(alerts: any[]): Observable<AlertNotification[]> {
    const alertObservables = alerts.map(alert => {
      if (alert.transactionId) {
        return this.getTransactionAmount(alert.transactionId).pipe(
          map(amount => ({
            ...alert,
            transactionAmount: amount
          })),
          catchError(() => of({
            ...alert,
            transactionAmount: this.generateDemoAmount(alert.alertId || 1)
          }))
        );
      } else {
        return of({
          ...alert,
          transactionAmount: this.generateDemoAmount(alert.alertId || 1)
        });
      }
    });

    return forkJoin(alertObservables).pipe(
      map((enrichedAlerts: any[]) => enrichedAlerts.map((alert: any) => this.mapToAlert(alert)))
    );
  }

  // Get transaction amount by transaction ID
  private getTransactionAmount(transactionId: string): Observable<number> {
    return this.http.get<any>(`${this.API_URL}/customers/transactions`, this.getHttpOptions()).pipe(
      map((response: any) => {
        const transactions = response.data || response;
        if (Array.isArray(transactions)) {
          const transaction = transactions.find(t => t.transactionId === transactionId);
          return transaction ? (transaction.amount || 0) : 0;
        }
        return 0;
      })
    );
  }

  // Sample alerts for testing
  private getSampleAlerts(): AlertNotification[] {
    return [
      {
        id: 1,
        transactionId: 'TXN780123',
        amount: 5000.00,
        date: '2024-07-28',
        reason: 'Unusual transfer pattern to high-risk region identified',
        status: 'PENDING',
        type: 'FLAGGED',
        severity: 'HIGH',
        description: 'Transaction exceeds normal pattern for this customer',
        createdAt: '2024-07-28T10:30:00'
      },
      {
        id: 2,
        transactionId: 'TXN123457',
        amount: 5000.00,
        date: '2024-07-27',
        reason: 'Originating account flagged for suspicious activity',
        status: 'RESOLVED',
        type: 'CANCELED',
        severity: 'HIGH',
        description: 'Account verification completed successfully',
        createdAt: '2024-07-27T14:20:00'
      },
      {
        id: 3,
        transactionId: 'TXN876543',
        amount: 750.00,
        date: '2024-07-26',
        reason: 'Transaction exceeding daily limit for new accounts',
        status: 'PENDING',
        type: 'FLAGGED',
        severity: 'MEDIUM',
        description: 'New account requires additional verification',
        createdAt: '2024-07-26T09:15:00'
      }
    ];
  }

  // Get alert statistics - calculated from alerts since no stats endpoint exists
  getAlertStats(): Observable<AlertStats> {
    return this.getCustomerAlerts().pipe(
      map((alerts: AlertNotification[]) => {
        const pending = alerts.filter(a => 
          a.status === 'PENDING' || a.status === 'OPEN' || a.status === 'NEW'
        ).length;
        const resolved = alerts.filter(a => 
          a.status === 'RESOLVED' || a.status === 'CLOSED' || a.status === 'COMPLETED'
        ).length;
        
        return {
          pending: pending,
          resolved: resolved,
          total: alerts.length
        };
      })
    );
  }

  // Get alert by ID
  getAlertById(alertId: number): Observable<AlertNotification> {
    return this.http.get<any>(`${this.API_URL}/customers/alerts/${alertId}`, this.getHttpOptions()).pipe(
      map((response: any) => {
        // Handle ApiResponseDto wrapper
        const alertData = response.data || response;
        return this.mapToAlert(alertData);
      })
    );
  }

  // Contact support about an alert - using helpdesk endpoint
  contactSupport(alertId: number, message: string): Observable<any> {
    const ticketRequest = {
      subject: `Alert Support Request - Alert ID: ${alertId}`,
      description: message,
      priority: 'MEDIUM'
    };
    
    return this.http.post<any>(
      `${this.API_URL}/customers/helpdesk/tickets`,
      ticketRequest,
      this.getHttpOptions()
    );
  }

  // Helper method to map API response to AlertNotification interface
  private mapToAlert(data: any): AlertNotification {
    // Use the fetched transaction amount or fallback to demo amount
    const amount = data.transactionAmount || data.amount || 0;

    return {
      id: data.alertId || data.id,
      transactionId: data.transactionId || 'N/A',
      amount: amount,
      date: data.createdAt || data.timestamp,
      reason: data.ruleTriggered || data.reason || 'Flagged for review',
      status: data.status || 'PENDING',
      type: this.determineTypeFromStatus(data.status),
      severity: this.determineSeverityFromRiskScore(data.riskScore),
      description: data.ruleTriggered || data.description || '',
      createdAt: data.createdAt
    };
  }

  // Generate demo amounts for testing when real amounts not available
  private generateDemoAmount(alertId: number): number {
    const amounts = [1500.00, 2750.50, 5000.00, 850.25, 12000.00, 3200.75];
    return amounts[alertId % amounts.length];
  }

  // Determine alert type from status
  private determineTypeFromStatus(status: string): 'FLAGGED' | 'CANCELED' | 'SUSPICIOUS' {
    if (status === 'CANCELED' || status === 'CANCELLED') return 'CANCELED';
    if (status === 'HIGH_RISK') return 'SUSPICIOUS';
    return 'FLAGGED';
  }

  // Determine severity from risk score
  private determineSeverityFromRiskScore(riskScore: number): 'HIGH' | 'MEDIUM' | 'LOW' {
    if (riskScore >= 80) return 'HIGH';
    if (riskScore >= 50) return 'MEDIUM';
    return 'LOW';
  }

  // Determine alert type from data
  private determineType(data: any): 'FLAGGED' | 'CANCELED' | 'SUSPICIOUS' {
    if (data.type) return data.type;
    if (data.status === 'CANCELED') return 'CANCELED';
    if (data.severity === 'HIGH') return 'SUSPICIOUS';
    return 'FLAGGED';
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
