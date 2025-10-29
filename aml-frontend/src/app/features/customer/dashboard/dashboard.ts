import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { DashboardService } from '../../../core/services/dashboard.service';
import { DashboardStats, Transaction, Alert, CustomerProfile } from '../../../core/models/dashboard.models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard-content.html',
  styleUrl: './dashboard-content.css',
})
export class Dashboard implements OnInit {
  activeTab: string = 'dashboard';
  userMenuOpen: boolean = false;
  isLoading: boolean = true;
  errorMessage: string = '';

  // Dashboard data
  dashboardData: DashboardStats = {
    totalTransactions: 0,
    lastLogin: '',
    newAlerts: 0,
    pendingTransactions: 0
  };

  recentTransactions: Transaction[] = [];
  recentAlerts: Alert[] = [];
  customerProfile: CustomerProfile | null = null;

  ngOnInit(): void {
    this.loadDashboardData();
  }

  private loadDashboardData(): void {
    this.isLoading = true;
    this.errorMessage = '';

    console.log('Loading dashboard data...');
    console.log('JWT Token:', localStorage.getItem('token'));

    // Load data from API only - no fallback data
    Promise.all([
      this.dashboardService.getDashboardStats().toPromise(),
      this.dashboardService.getRecentTransactions(5).toPromise(),
      this.dashboardService.getRecentAlerts(5).toPromise(),
      this.dashboardService.getCustomerProfile().toPromise()
    ]).then(([stats, transactions, alerts, profile]) => {
      console.log('Dashboard Stats:', stats);
      console.log('Recent Transactions:', transactions);
      console.log('Recent Alerts:', alerts);
      console.log('Customer Profile:', profile);

      this.dashboardData = stats || this.dashboardData;
      this.recentTransactions = transactions || [];
      this.recentAlerts = alerts || [];
      this.customerProfile = profile || null;
      this.isLoading = false;
      
      console.log('Successfully loaded data from API');
      
      // Log the display name being used
      console.log('Display Name:', this.getUserDisplayName());
    }).catch(error => {
      this.isLoading = false;
      this.errorMessage = 'Unable to load dashboard data. Please check the backend APIs.';
      console.error('API Error Details:', error);
      console.error('Error Status:', error.status);
      console.error('Error Message:', error.message);
    });
  }


  setActiveTab(tab: string): void {
    this.activeTab = tab;
    console.log('Active tab:', tab);
    
    // Navigate to different routes based on tab
    switch(tab) {
      case 'dashboard':
        this.router.navigate(['/customer/dashboard']);
        break;
      case 'accounts':
        this.router.navigate(['/customer/accounts']);
        break;
      case 'kyc':
        this.router.navigate(['/customer/kyc']);
        break;
      case 'transactions':
        this.router.navigate(['/customer/transactions']);
        break;
      case 'alerts':
        this.router.navigate(['/customer/alerts']);
        break;
      case 'profile':
        this.router.navigate(['/customer/profile']);
        break;
    }
  }

  toggleUserMenu(): void {
    this.userMenuOpen = !this.userMenuOpen;
  }

  constructor(
    private authService: AuthService,
    private router: Router,
    private dashboardService: DashboardService
  ) {}

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  getRiskClass(risk: number): string {
    if (risk >= 95) return 'risk-100';
    if (risk >= 80) return 'risk-95';
    return 'risk-61';
  }

  getStatusClass(status: string): string {
    switch (status.toLowerCase()) {
      case 'completed': return 'completed';
      case 'blocked': return 'blocked';
      case 'pending': return 'pending';
      case 'open': return 'open';
      case 'true positive': return 'positive';
      case 'false positive': return 'negative';
      case 'resolved': return 'resolved';
      default: return '';
    }
  }

  refreshDashboard(): void {
    this.errorMessage = '';
    this.loadDashboardData();
  }

  // Method to manually try loading API data
  loadApiData(): void {
    this.isLoading = true;
    this.errorMessage = '';

    console.log('🔄 Manual API refresh triggered...');

    // Test each API individually to identify which ones are failing
    const apiCalls = [
      { name: 'Dashboard Stats', call: this.dashboardService.getDashboardStats().toPromise() },
      { name: 'Recent Transactions', call: this.dashboardService.getRecentTransactions(5).toPromise() },
      { name: 'Recent Alerts', call: this.dashboardService.getRecentAlerts(5).toPromise() },
      { name: 'Customer Profile', call: this.dashboardService.getCustomerProfile().toPromise() }
    ];

    Promise.allSettled(apiCalls.map(api => api.call)).then(results => {
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          console.log(`✅ ${apiCalls[index].name}:`, result.value);
        } else {
          console.error(`❌ ${apiCalls[index].name} failed:`, result.reason);
        }
      });

      // Update data with successful responses
      if (results[0].status === 'fulfilled') this.dashboardData = (results[0].value as DashboardStats) || this.dashboardData;
      if (results[1].status === 'fulfilled') this.recentTransactions = (results[1].value as Transaction[]) || [];
      if (results[2].status === 'fulfilled') this.recentAlerts = (results[2].value as Alert[]) || [];
      if (results[3].status === 'fulfilled') this.customerProfile = (results[3].value as CustomerProfile) || null;

      this.isLoading = false;
      
      const failedCalls = results.filter(r => r.status === 'rejected').length;
      if (failedCalls === 0) {
        console.log('✅ All APIs loaded successfully!');
        this.errorMessage = '';
      } else {
        this.errorMessage = `⚠️ ${failedCalls} out of 4 APIs failed. Check console for details.`;
      }
    });
  }

  getUserDisplayName(): string {
    // First try to get from API response
    if (this.customerProfile && this.customerProfile.firstName && this.customerProfile.lastName) {
      return `${this.customerProfile.firstName} ${this.customerProfile.lastName}`;
    }
    
    // Then try localStorage (from registration)
    const firstName = localStorage.getItem('firstName');
    const lastName = localStorage.getItem('lastName');
    if (firstName && lastName) {
      return `${firstName} ${lastName}`;
    }
    
    // Better fallback - don't use email parsing, just show "Loading..."
    if (this.isLoading) {
      return 'Loading...';
    }
    
    // Final fallback
    const email = localStorage.getItem('email');
    return email ? email.split('@')[0] : 'User';
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB'); // DD/MM/YYYY format
  }
}
