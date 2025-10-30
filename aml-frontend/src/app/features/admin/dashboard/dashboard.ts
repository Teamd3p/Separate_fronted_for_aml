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
  openHelpTickets: number;
  activeAccounts: number;
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
    openHelpTickets: 0,
    activeAccounts: 0
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
    // Try to load from admin dashboard stats endpoint first
    this.tryLoadFromAdminStats();
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
            // Fix pending alerts - check for PENDING status (enum value)
            this.stats.pendingAlerts = alerts.filter(a => 
              a.status === 'PENDING' || a.status === 'OPEN' || a.status === 'NEW'
            ).length;
            // Fix SAR count - check for SAR-related fields
            this.stats.totalSars = alerts.filter(a => 
              a.sarGenerated === true || a.sarId || a.sarStatus
            ).length;
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

    // Load help tickets data (simulated for now)
    this.loadHelpTicketsData(headers);
    
    // Load active accounts data from customers endpoint
    this.http.get<any>(`${this.apiUrl}/kyc/compliance/customers/status`, { headers })
      .subscribe({
        next: (response) => {
          console.log('Customer accounts data received:', response);
          
          // Handle different response formats
          let accounts: any[] = [];
          if (Array.isArray(response)) {
            accounts = response;
          } else if (response && Array.isArray(response.content)) {
            accounts = response.content;
          } else if (response && Array.isArray(response.data)) {
            accounts = response.data;
          } else if (response && typeof response === 'object') {
            const keys = Object.keys(response);
            for (const key of keys) {
              if (Array.isArray(response[key])) {
                accounts = response[key];
                break;
              }
            }
          }
          
          // Improved active account counting logic
          this.stats.activeAccounts = accounts.filter(acc => {
            const status = acc.accountStatus || acc.status || acc.kycStatus;
            return status === 'ACTIVE' || 
                   status === 'VERIFIED' || 
                   status === 'APPROVED' ||
                   (!status && acc.isActive !== false);
          }).length;
          
          console.log('Active Accounts:', this.stats.activeAccounts);
        },
        error: (error) => {
          console.error('Error loading customer accounts:', error);
          this.stats.activeAccounts = 0;
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

  setActiveTab(tab: string, event?: Event): void {
    if (event) {
      event.preventDefault();
    }
    
    console.log('Dashboard: Navigating to tab:', tab);
    
    switch(tab) {
      case 'dashboard':
        // Already on dashboard
        break;
      case 'users':
        console.log('Dashboard: Navigating to /admin/users');
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
        // this.router.navigate(['/admin/reports']); // Route doesn't exist yet
        console.log('Reports page not implemented yet');
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

  private loadHelpTicketsData(headers: HttpHeaders): void {
    // Simulate help tickets data for now
    // In a real implementation, this would call something like:
    // this.http.get<any[]>(`${this.apiUrl}/support/tickets/open`, { headers })
    
    // For now, simulate based on pending alerts and other factors
    setTimeout(() => {
      // Simulate help tickets as a percentage of total alerts + some base number
      const baseTickets = 5;
      const alertBasedTickets = Math.floor(this.stats.totalAlerts * 0.15); // 15% of alerts might generate tickets
      this.stats.openHelpTickets = baseTickets + alertBasedTickets;
      console.log('Simulated Open Help Tickets:', this.stats.openHelpTickets);
    }, 1000);
  }

  private tryLoadFromAdminStats(): void {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    // Try to load from admin dashboard stats endpoint if available
    this.http.get<any>(`${this.apiUrl}/admin/dashboard/stats`, { headers })
      .subscribe({
        next: (dashboardStats) => {
          console.log('Admin dashboard stats received:', dashboardStats);
          
          // Update stats from backend if available
          if (dashboardStats) {
            if (dashboardStats.totalUsers !== undefined) this.stats.totalUsers = dashboardStats.totalUsers;
            if (dashboardStats.totalCustomers !== undefined) this.stats.totalCustomers = dashboardStats.totalCustomers;
            if (dashboardStats.totalOfficers !== undefined) this.stats.totalOfficers = dashboardStats.totalOfficers;
            if (dashboardStats.totalAlerts !== undefined) this.stats.totalAlerts = dashboardStats.totalAlerts;
            if (dashboardStats.pendingAlerts !== undefined) this.stats.pendingAlerts = dashboardStats.pendingAlerts;
            if (dashboardStats.totalSars !== undefined) this.stats.totalSars = dashboardStats.totalSars;
            if (dashboardStats.activeAccounts !== undefined) this.stats.activeAccounts = dashboardStats.activeAccounts;
            if (dashboardStats.openHelpTickets !== undefined) this.stats.openHelpTickets = dashboardStats.openHelpTickets;
          }
        },
        error: (error) => {
          console.log('Admin dashboard stats endpoint not available, using individual endpoints');
          // This is expected if the backend doesn't have this endpoint yet
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
