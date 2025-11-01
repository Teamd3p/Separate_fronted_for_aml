import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ComplianceService, SAR, Alert } from '../../../core/services/compliance.service';

interface SARData {
  // Subject Information
  subjectName: string;
  subjectDOB: string;
  identificationType: string;
  identificationNumber: string;
  nationality: string;
  address: string;
  
  // Activity Information
  activityType: string;
  activityDescription: string;
  
  // Transaction Details
  totalAmount: number;
  currency: string;
  transactionCount: number;
  dateRange: string;
  
  // Investigation
  investigationFindings: string;
  
  // Supporting Documentation
  supportingDocs: string;
  
  // Regulatory
  regulatoryAuthority: string;
  complianceNotes: string;
  
  // Officer Declaration
  officerName: string;
  officerId: string;
  declaration: boolean;
}

@Component({
  selector: 'app-sar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './sar.html',
  styleUrls: ['./sar.css']
})
export class Sar implements OnInit {
  sars: SAR[] = [];
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  
  // SAR Form
  showSarForm = false;
  selectedAlertId: number | null = null;
  selectedAlert: Alert | null = null;
  
  // Comprehensive SAR Data
  sarData: SARData = {
    subjectName: '',
    subjectDOB: '',
    identificationType: '',
    identificationNumber: '',
    nationality: '',
    address: '',
    activityType: '',
    activityDescription: '',
    totalAmount: 0,
    currency: 'USD',
    transactionCount: 0,
    dateRange: '',
    investigationFindings: '',
    supportingDocs: '',
    regulatoryAuthority: '',
    complianceNotes: '',
    officerName: '',
    officerId: '',
    declaration: false
  };
  
  constructor(
    private complianceService: ComplianceService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadSARs();
    
    // Check if there's an alert ID in query params
    this.route.queryParams.subscribe(params => {
      if (params['alertId']) {
        this.selectedAlertId = parseInt(params['alertId']);
        this.openSarForm(this.selectedAlertId);
      }
    });
  }

  loadSARs(): void {
    this.isLoading = true;
    this.errorMessage = '';
    
    this.complianceService.getAllSARs().subscribe({
      next: (sars) => {
        this.sars = sars;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading SARs:', error);
        this.errorMessage = 'Failed to load SARs';
        this.isLoading = false;
      }
    });
  }

  openSarForm(alertId: number): void {
    this.showSarForm = true;
    this.selectedAlertId = alertId;
    this.resetSarData();
    
    // Load alert details and auto-populate SAR form
    this.complianceService.getAlertDetails(alertId).subscribe({
      next: (alert) => {
        this.selectedAlert = alert;
        this.autoPopulateSARData(alert);
      },
      error: (error) => {
        console.error('Error loading alert:', error);
        this.errorMessage = 'Failed to load alert details';
      }
    });
  }

  autoPopulateSARData(alert: Alert): void {
    // Subject Information - from alert/customer data
    this.sarData.subjectName = alert.customerName || '';
    this.sarData.identificationType = 'NATIONAL_ID'; // Default
    this.sarData.identificationNumber = alert.customerId?.toString() || '';
    
    // Load customer details for additional information
    this.loadCustomerDetails(alert.customerId);
    
    // Activity Information - from alert
    this.sarData.activityType = this.mapRuleToActivityType(alert.ruleTriggered);
    this.sarData.activityDescription = this.generateActivityDescription(alert);
    
    // Transaction Details - Load from transaction service
    this.loadTransactionDetails(alert.transactionId);
    
    // Investigation Findings - Pre-filled template
    this.sarData.investigationFindings = this.generateInvestigationTemplate(alert);
    
    // Supporting Documentation - Auto-generated list
    this.sarData.supportingDocs = this.generateSupportingDocsList(alert);
    
    // Regulatory Compliance
    this.sarData.regulatoryAuthority = 'FINCEN'; // Default
    this.sarData.complianceNotes = '';
    
    // Officer Declaration - from current user
    const currentUser = localStorage.getItem('email') || '';
    const officerId = localStorage.getItem('userId') || '';
    this.sarData.officerName = currentUser.split('@')[0] || 'Compliance Officer';
    this.sarData.officerId = officerId;
    this.sarData.declaration = false; // Must be manually checked
  }

  loadCustomerDetails(customerId: number): void {
    // Load customer profile details using customer ID as account number
    this.complianceService.getAccountDetails(customerId.toString()).subscribe({
      next: (account) => {
        // Populate customer information from account details
        this.sarData.address = account.address || 'Address not available in customer records';
        this.sarData.nationality = account.country || '';
        this.sarData.subjectDOB = account.dateOfBirth || '';
        
        // You could also populate additional fields if available
        // this.sarData.phone = account.phone;
        // this.sarData.email = account.email;
      },
      error: (error) => {
        console.error('Error loading customer details:', error);
        // Set informative default message if customer details can't be loaded
        this.sarData.address = 'Customer address information not available in system';
        this.sarData.nationality = 'Not available';
        this.sarData.subjectDOB = '';
      }
    });
  }

  loadTransactionDetails(transactionId: number): void {
    // Load transaction details to get amount and currency
    this.complianceService.getTransactionDetails(transactionId).subscribe({
      next: (transaction) => {
        this.sarData.totalAmount = transaction.amount || 0;
        this.sarData.currency = transaction.currency || 'USD';
        this.sarData.transactionCount = 1;
        // Update activity description with actual amount
        if (this.selectedAlert) {
          this.sarData.activityDescription = this.generateActivityDescription(this.selectedAlert, transaction.amount, transaction.currency);
        }
      },
      error: (error) => {
        console.error('Error loading transaction details:', error);
        // Set defaults if transaction details can't be loaded
        this.sarData.totalAmount = 0;
        this.sarData.currency = 'USD';
        this.sarData.transactionCount = 1;
      }
    });
    
    // Set date range from alert
    if (this.selectedAlert) {
      this.sarData.dateRange = this.formatDateRange(this.selectedAlert.createdAt);
    }
  }

  mapRuleToActivityType(rule: string): string {
    const ruleMap: { [key: string]: string } = {
      'Threshold': 'STRUCTURING',
      'Velocity': 'RAPID_MOVEMENT',
      'Cross-Border': 'HIGH_RISK_JURISDICTION',
      'Rapid': 'RAPID_MOVEMENT',
      'Structuring': 'STRUCTURING',
      'Unusual': 'UNUSUAL_TRANSACTIONS'
    };
    
    for (const key in ruleMap) {
      if (rule.includes(key)) {
        return ruleMap[key];
      }
    }
    return 'UNUSUAL_TRANSACTIONS';
  }

  generateActivityDescription(alert: Alert, amount?: number, currency?: string): string {
    const date = new Date(alert.createdAt).toLocaleDateString();
    const amountStr = amount ? amount.toLocaleString() : '[Amount to be loaded]';
    const currencyStr = currency || 'USD';
    
    return `On ${date}, suspicious activity was detected for customer ${alert.customerName} (Customer ID: ${alert.customerId}).

WHAT WAS OBSERVED:
The system flagged a transaction of ${currencyStr} ${amountStr} that triggered the following rule: "${alert.ruleTriggered}". This transaction exhibited patterns consistent with potential money laundering activity.

WHEN IT OCCURRED:
Alert generated: ${date}
Transaction date: ${date}
Risk Score: ${alert.riskScore}/100

HOW IT WAS DETECTED:
The transaction was automatically flagged by our AML monitoring system based on predefined risk rules and behavioral analysis algorithms.

WHY IT IS SUSPICIOUS:
- High risk score of ${alert.riskScore} indicates significant deviation from normal customer behavior
- Transaction pattern matches known money laundering typologies
- ${alert.ruleTriggered}

PATTERNS IDENTIFIED:
The activity shows characteristics of ${this.getActivityCharacteristics(alert.ruleTriggered)}.`;
  }

  getActivityCharacteristics(rule: string): string {
    if (rule.includes('Structuring')) {
      return 'structuring or smurfing, where large amounts are broken into smaller transactions to avoid reporting thresholds';
    } else if (rule.includes('Velocity')) {
      return 'rapid movement of funds, with unusually high transaction frequency in a short time period';
    } else if (rule.includes('Cross-Border')) {
      return 'cross-border transfers to high-risk jurisdictions with weak AML controls';
    } else if (rule.includes('Rapid')) {
      return 'rapid withdrawal patterns inconsistent with the customer\'s stated business purpose';
    }
    return 'unusual transaction patterns that deviate significantly from the customer\'s historical behavior';
  }

  generateInvestigationTemplate(alert: Alert): string {
    return `INVESTIGATION STEPS TAKEN:
1. Reviewed customer transaction history for the past 90 days
2. Analyzed transaction patterns and frequency
3. Verified customer identity and KYC documentation
4. Checked customer against sanctions lists and PEP databases
5. Reviewed source of funds and business relationships

INFORMATION GATHERED:
- Customer Name: ${alert.customerName}
- Customer ID: ${alert.customerId}
- Alert ID: ${alert.alertId}
- Transaction ID: ${alert.transactionId}
- Risk Score: ${alert.riskScore}/100
- Rule Triggered: ${alert.ruleTriggered}
- Alert Status: ${alert.status}
- Investigation Status: ${alert.investigationStatus}

CUSTOMER RESPONSES:
[To be completed by officer if customer was contacted]

ADDITIONAL RED FLAGS DISCOVERED:
[To be completed by officer based on investigation]

CONCLUSION:
Based on the investigation conducted, the suspicious activity warrants filing of this SAR report. The transaction patterns and risk indicators suggest potential money laundering activity that requires regulatory attention.`;
  }

  generateSupportingDocsList(alert: Alert): string {
    return `• Alert Report #${alert.alertId}
• Transaction records for Customer ID ${alert.customerId}
• Customer account statements
• KYC documentation and identification verification
• Transaction monitoring system logs
• Risk assessment reports
• Customer communication records (if applicable)
• Previous investigation reports (if applicable)`;
  }

  formatDateRange(date: string): string {
    const alertDate = new Date(date);
    const startDate = new Date(alertDate);
    startDate.setDate(startDate.getDate() - 30); // 30 days before alert
    
    return `${startDate.toLocaleDateString()} - ${alertDate.toLocaleDateString()}`;
  }

  closeSarForm(): void {
    this.showSarForm = false;
    this.selectedAlertId = null;
    this.selectedAlert = null;
    this.resetSarData();
  }

  resetSarData(): void {
    this.sarData = {
      subjectName: '',
      subjectDOB: '',
      identificationType: '',
      identificationNumber: '',
      nationality: '',
      address: '',
      activityType: '',
      activityDescription: '',
      totalAmount: 0,
      currency: 'USD',
      transactionCount: 0,
      dateRange: '',
      investigationFindings: '',
      supportingDocs: '',
      regulatoryAuthority: '',
      complianceNotes: '',
      officerName: '',
      officerId: '',
      declaration: false
    };
  }

  isFormValid(): boolean {
    return !!(
      this.sarData.subjectName.trim() &&
      this.sarData.activityType &&
      this.sarData.activityDescription.trim() &&
      this.sarData.activityDescription.length >= 50 &&
      this.sarData.totalAmount > 0 &&
      this.sarData.investigationFindings.trim() &&
      this.sarData.regulatoryAuthority &&
      this.sarData.officerName.trim() &&
      this.sarData.officerId.trim() &&
      this.sarData.declaration
    );
  }

  submitSAR(): void {
    if (!this.selectedAlertId) {
      this.errorMessage = 'No alert selected';
      return;
    }

    if (!this.isFormValid()) {
      this.errorMessage = 'Please fill in all required fields';
      return;
    }
    
    // Compile comprehensive SAR summary
    const comprehensiveSummary = this.compileSARSummary();
    
    const sarRequest = {
      summary: comprehensiveSummary
    };
    
    this.complianceService.generateSAR(this.selectedAlertId, sarRequest).subscribe({
      next: (sar) => {
        this.successMessage = `SAR #${sar.sarId} created successfully`;
        this.closeSarForm();
        this.loadSARs();
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (error) => {
        console.error('Error creating SAR:', error);
        this.errorMessage = 'Failed to create SAR';
        setTimeout(() => this.errorMessage = '', 3000);
      }
    });
  }

  compileSARSummary(): string {
    const sections = [];
    
    // Subject Information
    sections.push('=== SUBJECT INFORMATION ===');
    sections.push(`Name: ${this.sarData.subjectName}`);
    if (this.sarData.subjectDOB) sections.push(`Date of Birth: ${this.sarData.subjectDOB}`);
    if (this.sarData.identificationType) sections.push(`ID Type: ${this.sarData.identificationType}`);
    if (this.sarData.identificationNumber) sections.push(`ID Number: ${this.sarData.identificationNumber}`);
    if (this.sarData.nationality) sections.push(`Nationality: ${this.sarData.nationality}`);
    if (this.sarData.address) sections.push(`Address: ${this.sarData.address}`);
    sections.push('');
    
    // Suspicious Activity
    sections.push('=== SUSPICIOUS ACTIVITY DESCRIPTION ===');
    sections.push(`Activity Type: ${this.sarData.activityType}`);
    sections.push(this.sarData.activityDescription);
    sections.push('');
    
    // Transaction Details
    sections.push('=== TRANSACTION DETAILS ===');
    sections.push(`Total Amount: ${this.sarData.currency} ${this.sarData.totalAmount.toLocaleString()}`);
    if (this.sarData.transactionCount) sections.push(`Number of Transactions: ${this.sarData.transactionCount}`);
    if (this.sarData.dateRange) sections.push(`Date Range: ${this.sarData.dateRange}`);
    sections.push('');
    
    // Investigation Findings
    sections.push('=== INVESTIGATION FINDINGS ===');
    sections.push(this.sarData.investigationFindings);
    sections.push('');
    
    // Supporting Documentation
    if (this.sarData.supportingDocs) {
      sections.push('=== SUPPORTING DOCUMENTATION ===');
      sections.push(this.sarData.supportingDocs);
      sections.push('');
    }
    
    // Regulatory Compliance
    sections.push('=== REGULATORY COMPLIANCE ===');
    sections.push(`Filing Authority: ${this.sarData.regulatoryAuthority}`);
    if (this.sarData.complianceNotes) sections.push(`Notes: ${this.sarData.complianceNotes}`);
    sections.push('');
    
    // Officer Declaration
    sections.push('=== OFFICER DECLARATION ===');
    sections.push(`Prepared by: ${this.sarData.officerName} (ID: ${this.sarData.officerId})`);
    sections.push(`Date: ${new Date().toLocaleDateString()}`);
    sections.push('Officer confirms accuracy and completeness of this report.');
    
    return sections.join('\n');
  }

  submitSARToRegulator(sarId: number): void {
    if (confirm('Submit this SAR to the regulator? This action cannot be undone.')) {
      this.complianceService.submitSAR(sarId).subscribe({
        next: (sar) => {
          this.successMessage = `SAR #${sarId} submitted to regulator`;
          this.loadSARs();
          setTimeout(() => this.successMessage = '', 3000);
        },
        error: (error) => {
          console.error('Error submitting SAR:', error);
          this.errorMessage = 'Failed to submit SAR';
          setTimeout(() => this.errorMessage = '', 3000);
        }
      });
    }
  }

  getStatusClass(status: string): string {
    const statusMap: any = {
      'DRAFT': 'status-draft',
      'SUBMITTED': 'status-submitted',
      'PENDING': 'status-pending',
      'ACKNOWLEDGED': 'status-acknowledged'
    };
    return statusMap[status] || 'status-draft';
  }
}
