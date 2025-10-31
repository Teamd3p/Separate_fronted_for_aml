import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ComplianceService, Alert, Transaction } from '../../../core/services/compliance.service';

@Component({
  selector: 'app-alerts',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './alerts.html',
  styleUrl: './alerts.css',
})
export class Alerts implements OnInit {
  activeTab: 'all' | 'assigned' = 'all';
  isLoading = false;
  allAlerts: Alert[] = [];
  assignedAlerts: Alert[] = [];
  filteredAlerts: Alert[] = [];
  
  // Investigation Modal
  showInvestigationModal = false;
  selectedAlert: Alert | null = null;
  customerTransactions: Transaction[] = [];
  loadingTransactions = false;
  investigationNotes = '';
  investigationAction = 'INVESTIGATING';
  
  // Filters
  filterStatus = 'all';
  filterRiskLevel = 'all';
  searchQuery = '';
  
  errorMessage = '';
  successMessage = '';

  constructor(
    private complianceService: ComplianceService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.loadAlerts();
    
    // Check if there's an alert ID in the route
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.openInvestigation(parseInt(params['id']));
      }
    });
  }

  loadAlerts(): void {
    this.isLoading = true;
    this.errorMessage = '';
    
    // Load all alerts
    this.complianceService.getAllAlerts().subscribe({
      next: (alerts) => {
        this.allAlerts = alerts;
        if (this.activeTab === 'all') {
          this.applyFilters();
        }
      },
      error: (error) => {
        console.error('Error loading alerts:', error);
        this.errorMessage = 'Failed to load alerts';
        this.isLoading = false;
      }
    });
    
    // Load assigned alerts
    this.complianceService.getMyAssignedAlerts().subscribe({
      next: (alerts) => {
        this.assignedAlerts = alerts;
        if (this.activeTab === 'assigned') {
          this.applyFilters();
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading assigned alerts:', error);
        this.isLoading = false;
      }
    });
  }

  switchTab(tab: 'all' | 'assigned'): void {
    this.activeTab = tab;
    this.applyFilters();
  }

  applyFilters(): void {
    let alerts = this.activeTab === 'all' ? this.allAlerts : this.assignedAlerts;
    
    // Filter by status
    if (this.filterStatus !== 'all') {
      alerts = alerts.filter(a => a.status === this.filterStatus);
    }
    
    // Filter by risk level
    if (this.filterRiskLevel !== 'all') {
      if (this.filterRiskLevel === 'high') {
        alerts = alerts.filter(a => a.riskScore >= 70);
      } else if (this.filterRiskLevel === 'medium') {
        alerts = alerts.filter(a => a.riskScore >= 40 && a.riskScore < 70);
      } else if (this.filterRiskLevel === 'low') {
        alerts = alerts.filter(a => a.riskScore < 40);
      }
    }
    
    // Search filter
    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      alerts = alerts.filter(a => 
        a.customerName.toLowerCase().includes(query) ||
        a.ruleTriggered.toLowerCase().includes(query) ||
        a.alertId.toString().includes(query)
      );
    }
    
    this.filteredAlerts = alerts;
  }

  assignToMe(alert: Alert, event: Event): void {
    event.stopPropagation();
    
    if (confirm(`Assign alert #${alert.alertId} to yourself?`)) {
      this.complianceService.assignAlertToMe(alert.alertId).subscribe({
        next: (updatedAlert) => {
          this.successMessage = `Alert #${alert.alertId} assigned successfully`;
          this.loadAlerts();
          setTimeout(() => this.successMessage = '', 3000);
        },
        error: (error) => {
          console.error('Error assigning alert:', error);
          this.errorMessage = 'Failed to assign alert';
          setTimeout(() => this.errorMessage = '', 3000);
        }
      });
    }
  }

  openInvestigation(alertId: number): void {
    this.loadingTransactions = true;
    this.showInvestigationModal = true;
    this.investigationNotes = '';
    this.investigationAction = 'INVESTIGATING';
    
    // Load alert details
    this.complianceService.getAlertDetails(alertId).subscribe({
      next: (alert) => {
        this.selectedAlert = alert;
        
        // Load customer transactions
        if (alert.customerId) {
          this.complianceService.getCustomerTransactions(alert.customerId).subscribe({
            next: (transactions) => {
              this.customerTransactions = transactions;
              this.loadingTransactions = false;
            },
            error: (error) => {
              console.error('Error loading transactions:', error);
              this.loadingTransactions = false;
            }
          });
        }
      },
      error: (error) => {
        console.error('Error loading alert details:', error);
        this.errorMessage = 'Failed to load alert details';
        this.closeInvestigationModal();
      }
    });
  }

  closeInvestigationModal(): void {
    this.showInvestigationModal = false;
    this.selectedAlert = null;
    this.customerTransactions = [];
    this.investigationNotes = '';
  }

  submitInvestigation(): void {
    if (!this.selectedAlert || !this.investigationNotes.trim()) {
      this.errorMessage = 'Please provide investigation notes';
      return;
    }
    
    const action = {
      action: this.investigationAction,
      notes: this.investigationNotes
    };
    
    this.complianceService.takeActionOnAlert(this.selectedAlert.alertId, action).subscribe({
      next: (updatedAlert) => {
        this.successMessage = 'Investigation action recorded successfully';
        this.closeInvestigationModal();
        this.loadAlerts();
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (error) => {
        console.error('Error submitting investigation:', error);
        this.errorMessage = 'Failed to submit investigation';
        setTimeout(() => this.errorMessage = '', 3000);
      }
    });
  }

  navigateToSAR(alert: Alert): void {
    this.router.navigate(['/compliance/sar'], { 
      queryParams: { alertId: alert.alertId } 
    });
  }

  getRiskClass(riskScore: number): string {
    if (riskScore >= 80) return 'critical';
    if (riskScore >= 60) return 'high';
    if (riskScore >= 40) return 'medium';
    return 'low';
  }

  getStatusClass(status: string): string {
    const statusMap: any = {
      'OPEN': 'status-open',
      'INVESTIGATING': 'status-investigating',
      'TRUE_POSITIVE': 'status-positive',
      'FALSE_POSITIVE': 'status-negative',
      'ESCALATED': 'status-escalated'
    };
    return statusMap[status] || 'status-open';
  }
}
