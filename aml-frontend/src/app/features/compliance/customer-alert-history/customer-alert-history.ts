import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ComplianceService, Alert } from '../../../core/services/compliance.service';

@Component({
  selector: 'app-customer-alert-history',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './customer-alert-history.html',
  styleUrls: ['./customer-alert-history.css']
})
export class CustomerAlertHistory implements OnInit {
  customerId: number | null = null;
  customerName: string = '';
  searchQuery: string = '';
  alerts: Alert[] = [];
  filteredAlerts: Alert[] = [];
  isLoading = false;
  errorMessage = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private complianceService: ComplianceService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      if (params['customerId']) {
        this.customerId = parseInt(params['customerId']);
        this.loadCustomerAlertHistory();
      }
    });
  }

  searchByCustomer(): void {
    if (!this.searchQuery.trim()) {
      this.errorMessage = 'Please enter a customer name or ID';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    
    // Try to parse as number for ID search
    const searchId = parseInt(this.searchQuery);
    
    if (!isNaN(searchId)) {
      // Search by ID
      this.customerId = searchId;
      this.loadCustomerAlertHistory();
    } else {
      // Search by name - we'll need to get all alerts and filter
      this.complianceService.getAllAlerts().subscribe({
        next: (allAlerts) => {
          const customerAlerts = allAlerts.filter(alert => 
            alert.customerName.toLowerCase().includes(this.searchQuery.toLowerCase())
          );
          
          if (customerAlerts.length > 0) {
            this.customerId = customerAlerts[0].customerId;
            this.customerName = customerAlerts[0].customerName;
            this.alerts = customerAlerts;
            this.filteredAlerts = customerAlerts;
          } else {
            this.errorMessage = 'No customer found with that name';
            this.alerts = [];
            this.filteredAlerts = [];
          }
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error searching customer:', error);
          this.errorMessage = 'Failed to search customer';
          this.isLoading = false;
        }
      });
    }
  }

  loadCustomerAlertHistory(): void {
    if (!this.customerId) return;
    
    this.isLoading = true;
    this.errorMessage = '';
    
    this.complianceService.getAlertHistoryByCustomer(this.customerId).subscribe({
      next: (alerts) => {
        this.alerts = alerts;
        this.filteredAlerts = alerts;
        if (alerts.length > 0) {
          this.customerName = alerts[0].customerName;
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading customer alert history:', error);
        this.errorMessage = 'Failed to load customer alert history';
        this.isLoading = false;
      }
    });
  }

  getRiskClass(riskScore: number): string {
    if (riskScore >= 70) return 'critical';
    if (riskScore >= 40) return 'high';
    return 'medium';
  }

  getStatusClass(status: string): string {
    const statusMap: any = {
      'OPEN': 'status-open',
      'INVESTIGATING': 'status-investigating',
      'POSITIVE': 'status-positive',
      'NEGATIVE': 'status-negative',
      'ESCALATED': 'status-escalated',
      'COMPLETED': 'status-completed'
    };
    return statusMap[status] || 'status-open';
  }

  viewAlertDetails(alertId: number): void {
    this.router.navigate(['/compliance/alerts', alertId]);
  }

  goBack(): void {
    this.router.navigate(['/compliance/alerts']);
  }
}
