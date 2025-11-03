import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AlertService, AlertNotification, AlertStats, CustomerTicket } from '../../../core/services/alert.service';

@Component({
  selector: 'app-alerts',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './alerts.html',
  styleUrl: './alerts.css',
})
export class Alerts implements OnInit {
  alerts: AlertNotification[] = [];
  filteredAlerts: AlertNotification[] = [];
  loading: boolean = false;
  
  // Tickets
  tickets: CustomerTicket[] = [];
  loadingTickets: boolean = false;
  
  // Statistics
  stats: AlertStats = {
    pending: 0,
    resolved: 0,
    total: 0
  };
  
  // Filter states
  activeTab: 'all' | 'pending' | 'resolved' = 'all';
  searchTerm: string = '';
  
  // Modal states
  showDetailsModal: boolean = false;
  showContactModal: boolean = false;
  showTicketDetailsModal: boolean = false;
  selectedAlert: AlertNotification | null = null;
  selectedTicket: CustomerTicket | null = null;
  contactMessage: string = '';
  sendingMessage: boolean = false;

  constructor(
    private alertService: AlertService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadAlerts();
    this.loadStats();
    this.loadTickets();
  }

  // Load alerts from API
  loadAlerts(): void {
    this.loading = true;
    this.alertService.getCustomerAlerts().subscribe({
      next: (alerts) => {
        this.alerts = alerts;
        this.applyFilters();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading alerts:', error);
        this.loading = false;
      }
    });
  }

  // Load statistics
  loadStats(): void {
    this.alertService.getAlertStats().subscribe({
      next: (stats) => {
        this.stats = stats;
      },
      error: (error) => {
        console.error('Error loading stats:', error);
        // Calculate stats from alerts if API fails
        this.calculateStatsFromAlerts();
      }
    });
  }

  // Load tickets
  loadTickets(): void {
    this.loadingTickets = true;
    this.alertService.getCustomerTickets().subscribe({
      next: (tickets) => {
        this.tickets = tickets;
        this.loadingTickets = false;
      },
      error: (error) => {
        console.error('Error loading tickets:', error);
        this.loadingTickets = false;
      }
    });
  }

  // Calculate stats from loaded alerts
  calculateStatsFromAlerts(): void {
    this.stats = {
      pending: this.alerts.filter(a => a.status === 'PENDING' || a.status === 'FLAGGED').length,
      resolved: this.alerts.filter(a => a.status === 'RESOLVED').length,
      total: this.alerts.length
    };
  }

  // Apply filters
  applyFilters(): void {
    let filtered = [...this.alerts];

    // Tab filter
    if (this.activeTab === 'pending') {
      filtered = filtered.filter(alert => 
        alert.status === 'PENDING' || alert.status === 'FLAGGED'
      );
    } else if (this.activeTab === 'resolved') {
      filtered = filtered.filter(alert => alert.status === 'RESOLVED');
    }

    // Search filter
    if (this.searchTerm.trim()) {
      const searchLower = this.searchTerm.toLowerCase();
      filtered = filtered.filter(alert =>
        alert.transactionId.toLowerCase().includes(searchLower) ||
        alert.reason.toLowerCase().includes(searchLower) ||
        alert.amount.toString().includes(searchLower)
      );
    }

    // Sort by date (newest first)
    filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    this.filteredAlerts = filtered;
  }

  // Switch tabs
  switchTab(tab: 'all' | 'pending' | 'resolved'): void {
    this.activeTab = tab;
    this.applyFilters();
  }

  // Search
  onSearchChange(): void {
    this.applyFilters();
  }

  // View alert details
  viewDetails(alert: AlertNotification): void {
    this.selectedAlert = alert;
    this.showDetailsModal = true;
  }

  // Open contact support modal
  openContactModal(alert: AlertNotification): void {
    this.selectedAlert = alert;
    this.contactMessage = '';
    this.showContactModal = true;
  }

  // Send contact support message
  contactSupport(): void {
    if (!this.selectedAlert || !this.contactMessage.trim()) {
      return;
    }

    this.sendingMessage = true;
    this.alertService.contactSupport(this.selectedAlert.id, this.contactMessage, this.selectedAlert).subscribe({
      next: () => {
        alert('Your inquiry has been submitted to our compliance team. You will receive a response within 24-48 hours explaining the alert details.');
        this.closeModals();
      },
      error: (error) => {
        console.error('Error contacting support:', error);
        alert('Failed to send inquiry. Please try again.');
        this.sendingMessage = false;
      }
    });
  }

  // Close modals
  closeModals(): void {
    this.showDetailsModal = false;
    this.showContactModal = false;
    this.showTicketDetailsModal = false;
    this.selectedAlert = null;
    this.selectedTicket = null;
    this.contactMessage = '';
    this.sendingMessage = false;
  }

  // View ticket details
  viewTicketDetails(ticket: CustomerTicket): void {
    this.selectedTicket = ticket;
    this.showTicketDetailsModal = true;
  }

  // Get ticket status badge class
  getTicketStatusClass(status: string): string {
    switch (status) {
      case 'OPEN': return 'status-open';
      case 'IN_PROGRESS': return 'status-in-progress';
      case 'RESOLVED': return 'status-resolved';
      case 'CLOSED': return 'status-closed';
      default: return 'status-open';
    }
  }

  // Get ticket priority badge class
  getTicketPriorityClass(priority: string): string {
    switch (priority) {
      case 'URGENT': return 'priority-urgent';
      case 'HIGH': return 'priority-high';
      case 'MEDIUM': return 'priority-medium';
      case 'LOW': return 'priority-low';
      default: return 'priority-medium';
    }
  }

  // Get alert icon class
  getAlertIconClass(alert: AlertNotification): string {
    if (alert.type === 'CANCELED' || alert.status === 'CANCELED') {
      return 'alert-icon-canceled';
    }
    if (alert.severity === 'HIGH' || alert.type === 'SUSPICIOUS') {
      return 'alert-icon-high';
    }
    return 'alert-icon-warning';
  }

  // Get alert type label
  getAlertTypeLabel(alert: AlertNotification): string {
    if (alert.type === 'CANCELED') return 'Canceled Transaction';
    if (alert.type === 'SUSPICIOUS') return 'Suspicious Activity';
    return 'Flagged Transaction';
  }

  // Format currency
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  // Format date
  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  }

  // Get pending alerts
  getPendingAlerts(): AlertNotification[] {
    return this.filteredAlerts.filter(alert => 
      alert.status === 'PENDING' || alert.status === 'FLAGGED' || alert.status === 'OPEN' || alert.status === 'NEW'
    );
  }

  // Get resolved alerts
  getResolvedAlerts(): AlertNotification[] {
    return this.filteredAlerts.filter(alert => 
      alert.status === 'RESOLVED' || alert.status === 'CLOSED' || alert.status === 'COMPLETED'
    );
  }

  // Navigation
  navigateTo(route: string): void {
    this.router.navigate([route]);
  }

  logout(): void {
    localStorage.removeItem('token');
    this.router.navigate(['/login']);
  }
}
