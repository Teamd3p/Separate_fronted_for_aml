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
  showDetailedReview = false;
  selectedAlert: Alert | null = null;
  selectedTransaction: Transaction | null = null;
  senderAccountDetails: any = null;
  receiverAccountDetails: any = null;
  customerTransactions: Transaction[] = [];
  loadingTransactions = false;
  loadingAccountDetails = false;
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
    
    // For "All Open Alerts" tab, show only unassigned alerts
    if (this.activeTab === 'all') {
      alerts = alerts.filter(a => this.isUnassigned(a));
    }
    
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
          
          // Remove from unassigned list immediately
          this.allAlerts = this.allAlerts.filter(a => a.alertId !== alert.alertId);
          this.applyFilters();
          
          // Reload to get updated data
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
    this.loadingAccountDetails = true;
    this.showInvestigationModal = true;
    this.showDetailedReview = false;
    this.investigationNotes = '';
    this.investigationAction = 'INVESTIGATING';
    this.selectedTransaction = null;
    this.senderAccountDetails = null;
    this.receiverAccountDetails = null;
    
    // Load alert details
    this.complianceService.getAlertDetails(alertId).subscribe({
      next: (alert) => {
        this.selectedAlert = alert;
        
        // Load transaction details if available
        if (alert.transactionId) {
          // First, try to find transaction in customer transactions
          this.complianceService.getCustomerTransactions(alert.customerId).subscribe({
            next: (transactions) => {
              this.customerTransactions = transactions;
              
              // Find the specific transaction
              const foundTransaction = transactions.find(t => t.transactionId === alert.transactionId);
              
              if (foundTransaction) {
                this.selectedTransaction = foundTransaction;
                console.log('Transaction found in customer transactions:', foundTransaction);
                
                // Create sender account details from transaction data
                this.senderAccountDetails = {
                  customerName: foundTransaction.customerName,
                  customerEmail: foundTransaction.customerEmail,
                  accountNumber: foundTransaction.senderAccountNumber,
                  accountType: 'SAVINGS', // Default type, can be updated if available
                  balance: null,
                  currency: foundTransaction.currency,
                  status: 'ACTIVE'
                };
                
                // Create receiver account details from transaction data
                this.receiverAccountDetails = {
                  customerName: foundTransaction.counterpartyName,
                  customerEmail: null,
                  accountNumber: foundTransaction.counterpartyAccount,
                  accountType: 'SAVINGS', // Default type, can be updated if available
                  balance: null,
                  currency: foundTransaction.currency,
                  status: 'ACTIVE'
                };
                
                console.log('Sender account details created:', this.senderAccountDetails);
                console.log('Receiver account details created:', this.receiverAccountDetails);
                
                this.loadingAccountDetails = false;
              } else {
                console.log('Transaction not found in customer transactions');
                this.loadingAccountDetails = false;
              }
              
              this.loadingTransactions = false;
            },
            error: (error) => {
              console.error('Error loading customer transactions:', error);
              this.loadingAccountDetails = false;
              this.loadingTransactions = false;
            }
          });
        } else {
          console.log('No transaction ID found for alert');
          this.loadingAccountDetails = false;
          this.loadingTransactions = false;
          this.selectedTransaction = null;
          
          // Still load customer transactions even if no transaction ID
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
    this.selectedTransaction = null;
    this.senderAccountDetails = null;
    this.receiverAccountDetails = null;
    this.customerTransactions = [];
    this.investigationNotes = '';
    this.loadingAccountDetails = false;
  }

  submitInvestigation(): void {
    if (!this.selectedAlert || !this.investigationNotes.trim()) {
      this.errorMessage = 'Please provide investigation notes';
      return;
    }
    
    // Backend expects: action (for logging) and decision (for status update)
    const request = {
      action: this.investigationAction,
      decision: this.investigationAction,  // Backend uses 'decision' field
      notes: this.investigationNotes
    };
    
    console.log('Submitting investigation:', request);
    
    this.complianceService.takeActionOnAlert(this.selectedAlert.alertId, request).subscribe({
      next: (updatedAlert) => {
        this.successMessage = `Investigation action "${this.investigationAction}" recorded successfully`;
        this.closeInvestigationModal();
        this.loadAlerts();
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (error) => {
        console.error('Error submitting investigation:', error);
        this.errorMessage = error.error?.message || 'Failed to submit investigation';
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

  isUnassigned(alert: Alert): boolean {
    return !alert.assignedOfficerName || alert.assignedOfficerName.trim() === '';
  }
}
