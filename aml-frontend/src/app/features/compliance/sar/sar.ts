import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ComplianceService, SAR, Alert } from '../../../core/services/compliance.service';

@Component({
  selector: 'app-sar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './sar.html',
  styleUrl: './sar.css',
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
  sarSummary = '';
  
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
    this.sarSummary = '';
    
    // Load alert details
    this.complianceService.getAlertDetails(alertId).subscribe({
      next: (alert) => {
        this.selectedAlert = alert;
      },
      error: (error) => {
        console.error('Error loading alert:', error);
        this.errorMessage = 'Failed to load alert details';
      }
    });
  }

  closeSarForm(): void {
    this.showSarForm = false;
    this.selectedAlertId = null;
    this.selectedAlert = null;
    this.sarSummary = '';
  }

  submitSAR(): void {
    if (!this.selectedAlertId || !this.sarSummary.trim()) {
      this.errorMessage = 'Please provide a detailed summary';
      return;
    }
    
    const sarRequest = {
      summary: this.sarSummary
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
