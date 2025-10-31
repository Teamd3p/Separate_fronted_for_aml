import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { KycService } from '../../../core/services/kyc.service';
import { 
  KycDocument, 
  KycStatus, 
  KycDocumentVerificationRequest,
  DocumentType 
} from '../../../core/models/kyc.models';

interface ReviewData {
  verificationNotes: string;
}

interface FilterOptions {
  status: string;
  documentType: string;
  customerSearch: string;
  riskLevel: string;
}

@Component({
  selector: 'app-kyc-review',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './kyc-review.html',
  styleUrl: './kyc-review.css',
})
export class KycReview implements OnInit {
  kycDocuments: KycDocument[] = [];
  filteredDocuments: KycDocument[] = [];
  reviewData: ReviewData = {
    verificationNotes: ''
  };
  
  filterOptions: FilterOptions = {
    status: 'ALL',
    documentType: 'ALL',
    customerSearch: '',
    riskLevel: 'ALL'
  };

  kycStatuses = Object.values(KycStatus);
  documentTypes = Object.values(DocumentType);
  loading = false;
  selectedDocuments: number[] = [];

  constructor(
    private router: Router,
    private kycService: KycService
  ) {}

  ngOnInit(): void {
    this.loadAllDocuments();
  }

  loadAllDocuments(): void {
    this.loading = true;
    this.kycService.getPendingDocuments().subscribe({
      next: (documents) => {
        this.kycDocuments = documents;
        this.applyFilters();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading KYC documents:', error);
        alert('Failed to load KYC documents. Please try again.');
        this.loading = false;
      }
    });
  }

  loadDocumentsByStatus(status: KycStatus): void {
    this.loading = true;
    this.kycService.getDocumentsByStatus(status).subscribe({
      next: (documents) => {
        this.kycDocuments = documents;
        this.applyFilters();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading documents by status:', error);
        alert('Failed to load documents. Please try again.');
        this.loading = false;
      }
    });
  }

  applyFilters(): void {
    let filtered = [...this.kycDocuments];

    // Filter by status
    if (this.filterOptions.status !== 'ALL') {
      filtered = filtered.filter(doc => doc.status === this.filterOptions.status);
    }

    // Filter by document type
    if (this.filterOptions.documentType !== 'ALL') {
      filtered = filtered.filter(doc => doc.documentType === this.filterOptions.documentType);
    }

    // Filter by customer search
    if (this.filterOptions.customerSearch.trim()) {
      const searchTerm = this.filterOptions.customerSearch.toLowerCase();
      filtered = filtered.filter(doc => 
        doc.customerName.toLowerCase().includes(searchTerm) ||
        doc.fileName.toLowerCase().includes(searchTerm) ||
        doc.id.toString().includes(searchTerm)
      );
    }

    // Filter by risk level
    if (this.filterOptions.riskLevel !== 'ALL') {
      filtered = filtered.filter(doc => {
        const riskScore = doc.riskScore || 0;
        switch (this.filterOptions.riskLevel) {
          case 'HIGH': return riskScore >= 70;
          case 'MEDIUM': return riskScore >= 40 && riskScore < 70;
          case 'LOW': return riskScore < 40;
          default: return true;
        }
      });
    }

    this.filteredDocuments = filtered;
  }

  onFilterChange(): void {
    this.applyFilters();
  }

  onStatusFilterChange(): void {
    if (this.filterOptions.status === 'ALL') {
      this.loadAllDocuments();
    } else {
      this.loadDocumentsByStatus(this.filterOptions.status as KycStatus);
    }
  }

  setActiveTab(tab: string, event?: Event): void {
    if (event) {
      event.preventDefault();
    }
    
    switch(tab) {
      case 'dashboard':
        this.router.navigate(['/admin/dashboard']);
        break;
      case 'users':
        this.router.navigate(['/admin/users']);
        break;
      case 'kyc':
        // Already on KYC page
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

  verifyDocument(doc: KycDocument): void {
    this.updateDocumentStatus(doc, KycStatus.VERIFIED, 'Document verified successfully');
  }

  rejectDocument(doc: KycDocument): void {
    if (!this.reviewData.verificationNotes.trim()) {
      alert('Please provide verification notes explaining the reason for rejection.');
      return;
    }
    this.updateDocumentStatus(doc, KycStatus.REJECTED, this.reviewData.verificationNotes);
  }

  markForManualReview(doc: KycDocument): void {
    this.updateDocumentStatus(doc, KycStatus.MANUAL_REVIEW, 'Marked for manual review');
  }

  markAsExpired(doc: KycDocument): void {
    this.updateDocumentStatus(doc, KycStatus.EXPIRED, 'Document marked as expired');
  }

  updateDocumentStatus(doc: KycDocument, status: KycStatus, defaultNotes: string): void {
    const request: KycDocumentVerificationRequest = {
      documentId: doc.id,
      status: status,
      verificationNotes: this.reviewData.verificationNotes || defaultNotes
    };

    this.kycService.verifyDocument(request).subscribe({
      next: () => {
        alert(`Document #${doc.id} has been ${status.toLowerCase()} successfully.`);
        this.loadAllDocuments();
        this.reviewData.verificationNotes = '';
      },
      error: (error) => {
        console.error('Error updating document status:', error);
        alert('Failed to update document status. Please try again.');
      }
    });
  }

  // Bulk operations
  toggleDocumentSelection(docId: number): void {
    const index = this.selectedDocuments.indexOf(docId);
    if (index > -1) {
      this.selectedDocuments.splice(index, 1);
    } else {
      this.selectedDocuments.push(docId);
    }
  }

  selectAllDocuments(): void {
    if (this.selectedDocuments.length === this.filteredDocuments.length) {
      this.selectedDocuments = [];
    } else {
      this.selectedDocuments = this.filteredDocuments.map(doc => doc.id);
    }
  }

  bulkVerifyDocuments(): void {
    if (this.selectedDocuments.length === 0) {
      alert('Please select documents to verify.');
      return;
    }
    this.processBulkAction(KycStatus.VERIFIED, 'Bulk verification completed');
  }

  bulkRejectDocuments(): void {
    if (this.selectedDocuments.length === 0) {
      alert('Please select documents to reject.');
      return;
    }
    if (!this.reviewData.verificationNotes.trim()) {
      alert('Please provide verification notes for bulk rejection.');
      return;
    }
    this.processBulkAction(KycStatus.REJECTED, this.reviewData.verificationNotes);
  }

  processBulkAction(status: KycStatus, notes: string): void {
    const promises = this.selectedDocuments.map(docId => {
      const request: KycDocumentVerificationRequest = {
        documentId: docId,
        status: status,
        verificationNotes: notes
      };
      return this.kycService.verifyDocument(request).toPromise();
    });

    Promise.all(promises).then(() => {
      alert(`${this.selectedDocuments.length} documents have been ${status.toLowerCase()} successfully.`);
      this.selectedDocuments = [];
      this.loadAllDocuments();
      this.reviewData.verificationNotes = '';
    }).catch(error => {
      console.error('Error in bulk operation:', error);
      alert('Some documents failed to update. Please try again.');
    });
  }

  // Utility methods
  getStatusDisplay(status: KycStatus): string {
    return this.kycService.getStatusDisplay(status);
  }

  getStatusClass(status: KycStatus): string {
    return this.kycService.getStatusClass(status);
  }

  getRiskScoreClass(riskScore?: number): string {
    return this.kycService.getRiskScoreClass(riskScore);
  }

  getDocumentTypeDisplay(type: DocumentType): string {
    return this.kycService.getDocumentTypeDisplay(type);
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString();
  }

  canPerformAction(doc: KycDocument, action: string): boolean {
    switch (action) {
      case 'verify':
        return doc.status === KycStatus.PENDING || doc.status === KycStatus.MANUAL_REVIEW;
      case 'reject':
        return doc.status === KycStatus.PENDING || doc.status === KycStatus.MANUAL_REVIEW;
      case 'manual_review':
        return doc.status === KycStatus.PENDING;
      case 'expire':
        return doc.status !== KycStatus.EXPIRED;
      default:
        return false;
    }
  }

  trackByDocId(index: number, doc: KycDocument): number {
    return doc.id;
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('email');
    this.router.navigate(['/auth/login']);
  }
}
