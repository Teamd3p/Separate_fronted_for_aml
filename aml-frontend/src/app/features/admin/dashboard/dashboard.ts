import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { ToastService } from '../../../core/services/toast.service';

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

interface TrendData {
  month: string;
  alerts: number;
  sars: number;
  transactions: number;
}

interface ChartData {
  labels: string[];
  values: number[];
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {
  // Expose Math to template
  Math = Math;
  
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
  trendData: TrendData[] = [];
  riskDistribution: ChartData = { labels: [], values: [] };
  riskDistributionTotal = 0;
  loading = false;

  trendMax = {
    alerts: 1,
    sars: 1
  };

  private apiUrl = 'http://localhost:8080/api';

  constructor(
    private router: Router,
    private http: HttpClient,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.loadDashboardStats();
    this.loadDraftedSars();
    // Try to load from admin dashboard stats endpoint first
    this.tryLoadFromAdminStats();
    // Load chart data
    this.loadTrendData();
    this.loadRiskDistribution();
  }

  loadTrendData(): void {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    this.http.get<TrendData[]>(`${this.apiUrl}/admin/dashboard/alert-trend?days=180`, { headers })
      .subscribe({
        next: (data) => {
          this.trendData = Array.isArray(data) ? data : [];
          this.updateTrendScales();
        },
        error: () => {
          // Fallback: Generate from alerts
          this.generateFallbackTrends();
        }
      });
  }

  private generateFallbackTrends(): void {
    const months = ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    this.trendData = months.map(month => ({
      month,
      alerts: Math.floor(Math.random() * 50) + 20,
      sars: Math.floor(Math.random() * 20) + 5,
      transactions: Math.floor(Math.random() * 1000) + 500
    }));
    this.updateTrendScales();
  }

  loadRiskDistribution(): void {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    this.http.get<ChartData>(`${this.apiUrl}/admin/dashboard/risk-distribution`, { headers })
      .subscribe({
        next: (data) => {
          if (data && Array.isArray(data.labels) && Array.isArray(data.values)) {
            this.riskDistribution = {
              labels: data.labels,
              values: data.values
            };
          } else {
            this.riskDistribution = { labels: [], values: [] };
          }
          this.calculateRiskDistributionTotal();
        },
        error: () => {
          // Fallback data
          this.riskDistribution = {
            labels: ['Low Risk', 'Medium Risk', 'High Risk', 'Critical Risk'],
            values: [450, 320, 180, 50]
          };
          this.calculateRiskDistributionTotal();
        }
      });
  }

  getPercentage(value: number, total: number): number {
    return total > 0 ? Math.round((value / total) * 100) : 0;
  }

  getHighestRiskCategory(): string {
    if (!this.riskDistribution.values || this.riskDistribution.values.length === 0) {
      return 'N/A';
    }
    const maxValue = Math.max(...this.riskDistribution.values);
    const maxIndex = this.riskDistribution.values.indexOf(maxValue);
    const categoryName = this.riskDistribution.labels[maxIndex] || 'Unknown';
    return `${categoryName} (${maxValue})`;
  }

  getTrendBarHeight(value: number, type: 'alerts' | 'sars'): number {
    const maxValue = type === 'alerts' ? this.trendMax.alerts : this.trendMax.sars;
    if (!maxValue || !value) {
      return 0;
    }

    const percentage = (value / maxValue) * 100;
    const maxHeight = 150; // Max height in pixels
    return Math.round((percentage / 100) * maxHeight);
  }

  getTrendTotal(type: 'alerts' | 'sars'): number {
    if (!this.trendData.length) {
      return 0;
    }
    return this.trendData.reduce((sum, data) => sum + (type === 'alerts' ? data.alerts : data.sars), 0);
  }

  private updateTrendScales(): void {
    if (!this.trendData.length) {
      this.trendMax.alerts = 1;
      this.trendMax.sars = 1;
      return;
    }

    const alertsValues = this.trendData.map(data => Math.max(data.alerts || 0, 0));
    const sarsValues = this.trendData.map(data => Math.max(data.sars || 0, 0));

    this.trendMax.alerts = Math.max(1, ...alertsValues);
    this.trendMax.sars = Math.max(1, ...sarsValues);
  }

  private calculateRiskDistributionTotal(): void {
    if (!this.riskDistribution || !Array.isArray(this.riskDistribution.values)) {
      this.riskDistributionTotal = 0;
      return;
    }

    this.riskDistributionTotal = this.riskDistribution.values
      .map(value => Number(value) || 0)
      .reduce((sum, current) => sum + current, 0);
  }

  loadDashboardStats(): void {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    console.log('Loading dashboard stats with token:', token ? 'Token exists' : 'No token');

    // Load all customers from admin endpoint
    this.http.get<any>(`${this.apiUrl}/admin/customers`, { headers })
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

    // Load all alerts from compliance endpoint (admin has access)
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
    
    // Load active accounts data from admin customers endpoint
    this.http.get<any>(`${this.apiUrl}/admin/customers`, { headers })
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
          this.toastService.success(`SAR #${sarId} has been submitted successfully.`);
          this.loadDraftedSars();
          this.loadDashboardStats();
        },
        error: (error) => {
          console.error('Error submitting SAR:', error);
          const errorMsg = error.error?.message || error.message || 'Unknown error';
          this.toastService.error(`Failed to submit SAR: ${errorMsg}`);
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
