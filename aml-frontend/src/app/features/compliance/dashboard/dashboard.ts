import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ComplianceService, Alert } from '../../../core/services/compliance.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {
  isLoading = true;
  stats = {
    totalAlerts: 0,
    openAlerts: 0,
    assignedToMe: 0,
    highRiskAlerts: 0,
    totalSARs: 0,
    pendingSARs: 0
  };
  recentAlerts: Alert[] = [];
  errorMessage = '';

  constructor(
    private complianceService: ComplianceService
  ) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.isLoading = true;
    
    // Load all alerts to calculate stats
    this.complianceService.getAllAlerts().subscribe({
      next: (alerts) => {
        this.stats.totalAlerts = alerts.length;
        this.stats.openAlerts = alerts.filter(a => a.status === 'OPEN').length;
        this.stats.highRiskAlerts = alerts.filter(a => a.riskScore >= 70).length;
        this.recentAlerts = alerts.slice(0, 5);
      },
      error: (error) => {
        console.error('Error loading alerts:', error);
        this.errorMessage = 'Failed to load dashboard data';
      }
    });

    // Load assigned alerts
    this.complianceService.getMyAssignedAlerts().subscribe({
      next: (alerts) => {
        this.stats.assignedToMe = alerts.length;
      },
      error: (error) => console.error('Error loading assigned alerts:', error)
    });

    // Load SARs
    this.complianceService.getAllSARs().subscribe({
      next: (sars) => {
        this.stats.totalSARs = sars.length;
        this.stats.pendingSARs = sars.filter(s => s.status === 'DRAFT' || s.status === 'PENDING').length;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading SARs:', error);
        this.isLoading = false;
      }
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
