import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';

interface DashboardStats {
  totalUsers: number;
  totalCustomers: number;
  totalOfficers: number;
  totalAlerts: number;
  pendingAlerts: number;
  totalSars: number;
  totalSupportTickets: number;
  openSupportTickets: number;
}

interface DraftedSar {
  id: number;
  alertId: number;
  officerName: string;
  summary: string;
  createdDate: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {
  stats: DashboardStats = {
    totalUsers: 0,
    totalCustomers: 0,
    totalOfficers: 0,
    totalAlerts: 0,
    pendingAlerts: 0,
    totalSars: 0,
    totalSupportTickets: 0,
    openSupportTickets: 0
  };

  private customersCount = 0;
  private officersCount = 0;

  draftedSars: DraftedSar[] = [];
  private apiUrl = 'http://localhost:8080/api';

  constructor(
    private router: Router,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.loadDashboardStats();
    this.loadDraftedSars();
  }

  loadDashboardStats(): void {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    console.log('Loading dashboard stats with token:', token ? 'Token exists' : 'No token');

    // Load all customers from KYC compliance endpoint
    this.http.get<any>(`${this.apiUrl}/kyc/compliance/customers/status`, { headers })
      .subscribe({
        next: (response) => {
          console.log('Customers received:', response);
          
          // Handle different response formats
          let customers: any[] = [];
          if (Array.isArray(response)) {
            customers = response;
          } else if (response && Array.isArray(response.content)) {
            // Paginated response
            customers = response.content;
          } else if (response && Array.isArray(response.data)) {
            // Wrapped in data property
            customers = response.data;
          } else if (response && typeof response === 'object') {
            // Try to extract array from object
            const keys = Object.keys(response);
            console.log('Response keys:', keys);
            for (const key of keys) {
              if (Array.isArray(response[key])) {
                customers = response[key];
                break;
              }
            }
          }
          
          this.customersCount = customers.length;
          this.stats.totalCustomers = this.customersCount;
          // Update total users
          this.stats.totalUsers = this.customersCount + this.officersCount;
          console.log('Updated stats - Customers:', this.customersCount, 'Total Users:', this.stats.totalUsers);
        },
        error: (error) => {
          console.error('Error loading customers:', error);
          console.error('Error status:', error.status);
          console.error('Error details:', error.error);
          this.stats.totalCustomers = 0;
          this.customersCount = 0;
          this.stats.totalUsers = this.officersCount;
        }
      });

    // Load all compliance officers
    this.http.get<any[]>(`${this.apiUrl}/admin/officers`, { headers })
      .subscribe({
        next: (officers) => {
          console.log('Officers received:', officers);
          this.officersCount = Array.isArray(officers) ? officers.length : 0;
          this.stats.totalOfficers = this.officersCount;
          // Update total users
          this.stats.totalUsers = this.customersCount + this.officersCount;
          console.log('Updated stats - Officers:', this.officersCount, 'Total Users:', this.stats.totalUsers);
        },
        error: (error) => {
          console.error('Error loading officers:', error);
          console.error('Error status:', error.status);
          console.error('Error details:', error.error);
          this.stats.totalOfficers = 0;
          this.officersCount = 0;
          this.stats.totalUsers = this.customersCount;
        }
      });

    // Load all alerts
    this.http.get<any[]>(`${this.apiUrl}/compliance/alerts`, { headers })
      .subscribe({
        next: (alerts) => {
          console.log('Alerts received:', alerts);
          if (Array.isArray(alerts)) {
            this.stats.totalAlerts = alerts.length;
            this.stats.pendingAlerts = alerts.filter(a => a.status === 'PENDING').length;
            this.stats.totalSars = alerts.filter(a => a.sarGenerated).length;
          } else {
            console.warn('Alerts response is not an array:', alerts);
            this.stats.totalAlerts = 0;
            this.stats.pendingAlerts = 0;
            this.stats.totalSars = 0;
          }
        },
        error: (error) => {
          console.error('Error loading alerts:', error);
          console.error('Error status:', error.status);
          console.error('Error details:', error.error);
          this.stats.totalAlerts = 0;
          this.stats.pendingAlerts = 0;
          this.stats.totalSars = 0;
        }
      });

    // Try to load support tickets
    this.http.get<any[]>(`${this.apiUrl}/support/tickets`, { headers })
      .subscribe({
        next: (tickets) => {
          console.log('Support tickets received:', tickets);
          this.stats.totalSupportTickets = tickets.length;
          this.stats.openSupportTickets = tickets.filter(t => t.status === 'OPEN').length;
        },
        error: (error) => {
          console.error('Error loading support tickets:', error);
          // Keep default values if endpoint doesn't exist
          this.stats.totalSupportTickets = 0;
          this.stats.openSupportTickets = 0;
        }
      });
  }

  private loadUsersDirectly(headers: HttpHeaders): void {
    this.http.get<any[]>(`${this.apiUrl}/users`, { headers })
      .subscribe({
        next: (users) => {
          this.stats.totalUsers = users.length;
          this.stats.totalCustomers = users.filter(u => u.role === 'CUSTOMER').length;
          this.stats.totalOfficers = users.filter(u => u.role === 'COMPLIANCE_OFFICER' || u.role === 'ADMIN').length;
        },
        error: (error) => console.error('Error loading users directly:', error)
      });
  }

  private loadAlertsDirectly(headers: HttpHeaders): void {
    this.http.get<any[]>(`${this.apiUrl}/compliance/alerts`, { headers })
      .subscribe({
        next: (alerts) => {
          this.stats.totalAlerts = alerts.length;
          this.stats.pendingAlerts = alerts.filter(a => a.status === 'PENDING').length;
        },
        error: (error) => console.error('Error loading alerts directly:', error)
      });
  }

  loadDraftedSars(): void {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    // Get all alerts and filter for those with drafted SARs
    this.http.get<any[]>(`${this.apiUrl}/compliance/alerts`, { headers })
      .subscribe({
        next: (alerts) => {
          console.log('Alerts received for SAR filtering:', alerts);
          // Filter alerts that have SARs but not yet submitted
          const alertsWithDraftedSars = alerts.filter(alert => 
            alert.sarGenerated && alert.sarStatus === 'DRAFTED'
          );
          
          this.draftedSars = alertsWithDraftedSars.map(alert => ({
            id: alert.sarId || alert.id,
            alertId: alert.id,
            officerName: alert.assignedOfficer ? 
              `${alert.assignedOfficer.firstName || ''} ${alert.assignedOfficer.lastName || ''}`.trim() : 'N/A',
            summary: alert.suspiciousActivity || alert.description || 'No summary',
            createdDate: alert.sarCreatedDate ? new Date(alert.sarCreatedDate).toLocaleDateString() : 
                        (alert.createdDate ? new Date(alert.createdDate).toLocaleDateString() : 'N/A')
          }));
          
          console.log('Drafted SARs:', this.draftedSars);
        },
        error: (error) => {
          console.error('Error loading drafted SARs:', error);
          this.draftedSars = [];
        }
      });
  }

  setActiveTab(tab: string): void {
    switch(tab) {
      case 'dashboard':
        // Already on dashboard
        break;
      case 'users':
        this.router.navigate(['/admin/users']);
        break;
      case 'kyc':
        this.router.navigate(['/admin/kyc-review']);
        break;
      case 'rules':
        this.router.navigate(['/admin/rules']);
        break;
      case 'audit':
        this.router.navigate(['/admin/audit']);
        break;
      case 'reports':
        this.router.navigate(['/admin/reports']);
        break;
      case 'keywords':
        this.router.navigate(['/admin/keywords']);
        break;
      case 'countries':
        this.router.navigate(['/admin/countries']);
        break;
    }
  }

  submitSar(sarId: number): void {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    console.log('Submitting SAR:', sarId);
    this.http.post(`${this.apiUrl}/compliance/sar/${sarId}/submit`, {}, { headers })
      .subscribe({
        next: (response) => {
          console.log('SAR submitted successfully:', response);
          alert(`SAR #${sarId} has been submitted successfully.`);
          this.loadDraftedSars();
          this.loadDashboardStats();
        },
        error: (error) => {
          console.error('Error submitting SAR:', error);
          alert(`Failed to submit SAR: ${error.error?.message || error.message || 'Unknown error'}`);
        }
      });
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('email');
    this.router.navigate(['/auth/login']);
  }
}
