import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface Alert {
  alertId: number;
  transactionId: number;
  customerId: number;
  customerName: string;
  ruleTriggered: string;
  riskScore: number;
  status: string;
  investigationStatus: string;
  assignedToOfficer: string;
  assignedOfficerName: string;
  createdAt: string;
  updatedAt: string;
}

// Transaction interface with all required fields from backend
export interface Transaction {
  transactionId: number;
  customerId: number;
  customerName: string;
  customerEmail: string;
  senderAccountNumber: string;
  counterpartyAccount: string;
  amount: number;
  currency: string;
  description: string;
  transactionType: string;
  status: string;
  timestamp: string;
  counterpartyName: string;
  countryCode: string;
  riskScore: number;
}

export interface SAR {
  sarId: number;
  alertId: number;
  officerId: number;
  summary: string;
  status: string;
  createdAt: string;
  submittedAt: string;
}

export interface Ticket {
  ticketId: number;
  customerId: number;
  customerName: string;
  subject: string;
  description: string;
  status: string; // OPEN, IN_PROGRESS, RESOLVED, CLOSED
  priority: string; // LOW, MEDIUM, HIGH, URGENT
  assignedToId: number;
  resolution?: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
}

export interface TicketResponse {
  responseId: number;
  ticketId: number;
  officerId: number;
  officerName: string;
  message: string;
  createdAt: string;
}

export interface DashboardStats {
  totalAlerts: number;
  openAlerts: number;
  assignedToMe: number;
  highRiskAlerts: number;
  totalSARs: number;
  pendingSARs: number;
}

export interface InvestigationAction {
  action: string;
  notes: string;
}

export interface SARRequest {
  summary: string;
}

export interface OfficerProfile {
  userId: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  department: string;
  badgeNumber: string;
}

@Injectable({
  providedIn: 'root'
})
export class ComplianceService {
  private apiUrl = `${environment.apiUrl}/compliance`;

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  // Alerts
  getAllAlerts(): Observable<Alert[]> {
    return this.http.get<Alert[]>(`${this.apiUrl}/alerts`, {
      headers: this.getHeaders()
    });
  }

  getAlertsByStatus(status: string): Observable<Alert[]> {
    return this.http.get<Alert[]>(`${this.apiUrl}/alerts/status/${status}`, {
      headers: this.getHeaders()
    });
  }

  getMyAssignedAlerts(): Observable<Alert[]> {
    return this.http.get<Alert[]>(`${this.apiUrl}/alerts/history/officer`, {
      headers: this.getHeaders()
    });
  }

  getAlertDetails(alertId: number): Observable<Alert> {
    return this.http.get<Alert>(`${this.apiUrl}/alerts/${alertId}`, {
      headers: this.getHeaders()
    });
  }

  assignAlertToMe(alertId: number): Observable<Alert> {
    return this.http.post<Alert>(`${this.apiUrl}/alerts/${alertId}/assign`, {}, {
      headers: this.getHeaders()
    });
  }

  takeActionOnAlert(alertId: number, action: InvestigationAction): Observable<Alert> {
    return this.http.post<Alert>(`${this.apiUrl}/alerts/${alertId}/action`, action, {
      headers: this.getHeaders()
    });
  }

  // Transactions
  getCustomerTransactions(customerId: number): Observable<Transaction[]> {
    return this.http.get<Transaction[]>(`${this.apiUrl}/customers/${customerId}/transactions`, {
      headers: this.getHeaders()
    });
  }

  getAllTransactions(page: number = 0, size: number = 20): Observable<Transaction[]> {
    return this.http.get<Transaction[]>(`${this.apiUrl}/transactions/all`, {
      headers: this.getHeaders()
    });
  }

  // SAR
  generateSAR(alertId: number, sarRequest: SARRequest): Observable<SAR> {
    return this.http.post<SAR>(`${this.apiUrl}/alerts/${alertId}/sar`, sarRequest, {
      headers: this.getHeaders()
    });
  }

  getAllSARs(): Observable<SAR[]> {
    return this.http.get<SAR[]>(`${this.apiUrl}/sars`, {
      headers: this.getHeaders()
    });
  }

  submitSAR(sarId: number): Observable<SAR> {
    return this.http.post<SAR>(`${this.apiUrl}/sars/${sarId}/submit`, {}, {
      headers: this.getHeaders()
    });
  }

  // Profile
  getOfficerProfile(): Observable<OfficerProfile> {
    return this.http.get<OfficerProfile>(`${this.apiUrl}/profile`, {
      headers: this.getHeaders()
    });
  }

  updateOfficerProfile(profile: Partial<OfficerProfile>): Observable<OfficerProfile> {
    return this.http.put<OfficerProfile>(`${this.apiUrl}/profile`, profile, {
      headers: this.getHeaders()
    });
  }

  sendProfileUpdateOTP(): Observable<any> {
    return this.http.post(`${this.apiUrl}/profile/send-otp`, {}, {
      headers: this.getHeaders()
    });
  }

  // === HELPDESK TICKETS ===
  // Get all tickets (optionally filter by status)
  getAllTickets(status?: string): Observable<Ticket[]> {
    let url = `${this.apiUrl}/helpdesk/tickets`;
    if (status) {
      url += `?status=${status}`;
    }
    return this.http.get<Ticket[]>(url, {
      headers: this.getHeaders()
    });
  }

  // Get tickets assigned to logged-in officer
  getMyTickets(): Observable<Ticket[]> {
    return this.http.get<Ticket[]>(`${this.apiUrl}/helpdesk/tickets/my-tickets`, {
      headers: this.getHeaders()
    });
  }

  // Assign ticket to officer
  assignTicket(ticketId: number, adminId: number): Observable<Ticket> {
    return this.http.post<Ticket>(
      `${this.apiUrl}/helpdesk/tickets/${ticketId}/assign?adminId=${adminId}`,
      {},
      { headers: this.getHeaders() }
    );
  }

  // Resolve ticket
  resolveTicket(ticketId: number, resolution: string): Observable<Ticket> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Content-Type': 'text/plain',
      'Authorization': `Bearer ${token}`
    });
    
    return this.http.post<Ticket>(
      `${this.apiUrl}/helpdesk/tickets/${ticketId}/resolve`,
      resolution,
      { headers }
    );
  }

  // Delete ticket
  deleteTicket(ticketId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/helpdesk/tickets/${ticketId}`, {
      headers: this.getHeaders()
    });
  }

  // Alert History
  getAlertHistoryByCustomer(customerId: number): Observable<Alert[]> {
    return this.http.get<Alert[]>(`${this.apiUrl}/alerts/history/customer/${customerId}`, {
      headers: this.getHeaders()
    });
  }

  getTriggeredRules(alertId: number): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/alerts/${alertId}/rules`, {
      headers: this.getHeaders()
    });
  }

  // Get transaction details
  getTransactionDetails(transactionId: number): Observable<Transaction> {
    return this.http.get<Transaction>(`${this.apiUrl}/transactions/${transactionId}`, {
      headers: this.getHeaders()
    });
  }

  // Get account details
  getAccountDetails(accountNumber: string): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/accounts/${accountNumber}`, {
      headers: this.getHeaders()
    });
  }
}
