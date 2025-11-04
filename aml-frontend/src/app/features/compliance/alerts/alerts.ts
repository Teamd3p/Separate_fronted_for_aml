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
  Math = Math; // Expose Math to template
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
  
  // Pagination
  currentPage = 1;
  pageSize = 10;
  totalPages = 1;
  paginatedAlerts: Alert[] = [];
  
  errorMessage = '';
  successMessage = '';

  constructor(
    private complianceService: ComplianceService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Check for query parameters first
    this.route.queryParams.subscribe(queryParams => {
      if (queryParams['filter'] === 'assigned') {
        this.activeTab = 'assigned';
      }
    });
    
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
    this.currentPage = 1; // Reset to first page when switching tabs
    this.applyFilters();
  }

  getOpenAlertsCount(): number {
    // Count only unassigned open alerts
    return this.allAlerts.filter(alert => 
      !alert.assignedOfficerName && alert.status === 'OPEN'
    ).length;
  }

  updatePagination(): void {
    this.totalPages = Math.ceil(this.filteredAlerts.length / this.pageSize);
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.paginatedAlerts = this.filteredAlerts.slice(startIndex, endIndex);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePagination();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePagination();
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePagination();
    }
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxPagesToShow = 5;
    
    if (this.totalPages <= maxPagesToShow) {
      for (let i = 1; i <= this.totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (this.currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push(-1); // Ellipsis
        pages.push(this.totalPages);
      } else if (this.currentPage >= this.totalPages - 2) {
        pages.push(1);
        pages.push(-1); // Ellipsis
        for (let i = this.totalPages - 3; i <= this.totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push(-1); // Ellipsis
        for (let i = this.currentPage - 1; i <= this.currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push(-1); // Ellipsis
        pages.push(this.totalPages);
      }
    }
    
    return pages;
  }

  onPageSizeChange(): void {
    this.currentPage = 1;
    this.updatePagination();
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
    this.currentPage = 1; // Reset to first page when filters change
    this.updatePagination();
  }

  assignToMe(alert: Alert, event: Event): void {
    event.stopPropagation();
    
    if (confirm(`Assign alert #${alert.alertId} to yourself? Status will change to "Under Investigation".`)) {
      this.complianceService.assignAlertToMe(alert.alertId).subscribe({
        next: (updatedAlert) => {
          this.successMessage = `Alert #${alert.alertId} assigned and status changed to Under Investigation`;
          
          // Update the alert status locally
          alert.status = 'UNDER_INVESTIGATION';
          
          // Remove from unassigned list immediately
          this.allAlerts = this.allAlerts.filter(a => a.alertId !== alert.alertId);
          this.applyFilters();
          
          // Reload to get updated data with new status
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
    this.investigationAction = 'INVESTIGATING';
  }

  viewCustomerAlertHistory(customerId: number): void {
    this.router.navigate(['/compliance/customer-alert-history', customerId]);
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
      'UNDER_INVESTIGATION': 'status-investigating',
      'TRUE_POSITIVE': 'status-positive',
      'FALSE_POSITIVE': 'status-negative',
      'ESCALATED': 'status-escalated'
    };
    return statusMap[status] || 'status-open';
  }

  getRuleDescription(rule: string): string {
    if (!rule) return 'No rule information available';
    
    if (rule.includes('Threshold') || rule.includes('Large Transaction')) {
      return 'This transaction exceeded the regulatory threshold limit for single transactions, which may indicate an attempt to move large sums of money that require additional scrutiny under AML regulations.';
    } else if (rule.includes('Velocity') || rule.includes('High Activity') || rule.includes('Burst')) {
      return 'Unusual transaction velocity detected - multiple transactions occurring in a short time period, which could indicate rapid movement of funds to obscure the money trail.';
    } else if (rule.includes('Structuring') || rule.includes('Smurfing')) {
      return 'Potential structuring activity detected - breaking down large transactions into smaller amounts to avoid reporting thresholds, a common money laundering technique.';
    } else if (rule.includes('Cross-Border') || rule.includes('High-Risk')) {
      return 'Transaction involves high-risk jurisdictions or cross-border transfers that may be associated with money laundering, terrorist financing, or sanctions violations.';
    } else if (rule.includes('Frequency') || rule.includes('Weekend')) {
      return 'Abnormal transaction frequency or timing patterns detected, such as unusual activity during weekends or off-hours, which may indicate attempts to avoid detection.';
    } else if (rule.includes('Daily Volume')) {
      return 'Daily transaction volume significantly exceeds normal patterns for this customer, potentially indicating layering of illicit funds through multiple transactions.';
    } else {
      return 'This transaction triggered our AML monitoring system due to suspicious patterns that deviate from the customer\'s normal behavior and may indicate potential money laundering activity.';
    }
  }

  isUnassigned(alert: Alert): boolean {
    return !alert.assignedOfficerName || alert.assignedOfficerName.trim() === '';
  }
}
