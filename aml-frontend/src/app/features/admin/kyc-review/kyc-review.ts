import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';

interface KycDocument {
  id: number;
  customerName: string;
  type: string;
  fileName: string;
  uploadedDate: string;
  risk?: string;
  status: string;
}

interface ReviewData {
  officerId: string;
  verificationNotes: string;
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
  reviewData: ReviewData = {
    officerId: '',
    verificationNotes: ''
  };
  private apiUrl = 'http://localhost:8080/api';

  constructor(
    private router: Router,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.loadPendingDocuments();
  }

  loadPendingDocuments(): void {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    this.http.get<any[]>(`${this.apiUrl}/kyc/pending`, { headers })
      .subscribe({
        next: (response) => {
          this.kycDocuments = response.map(doc => ({
            id: doc.id,
            customerName: `${doc.customer?.firstName || ''} ${doc.customer?.lastName || ''}`.trim() || 'N/A',
            type: doc.documentType || 'N/A',
            fileName: doc.documentName || 'N/A',
            uploadedDate: doc.uploadDate ? new Date(doc.uploadDate).toLocaleDateString() : 'N/A',
            risk: doc.riskScore ? `${doc.riskScore}%` : '-',
            status: doc.status || 'PENDING'
          }));
        },
        error: (error) => {
          console.error('Error loading pending documents:', error);
          alert('Failed to load pending KYC documents. Please try again.');
        }
      });
  }

  setActiveTab(tab: string): void {
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
        this.router.navigate(['/admin/reports']);
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
    if (!this.reviewData.officerId) {
      alert('Please enter your Officer User ID before verifying.');
      return;
    }

    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    const verifyPayload = {
      documentId: doc.id,
      officerId: parseInt(this.reviewData.officerId),
      status: 'VERIFIED',
      verificationNotes: this.reviewData.verificationNotes || 'Document verified successfully'
    };

    this.http.post(`${this.apiUrl}/kyc/verify`, verifyPayload, { headers })
      .subscribe({
        next: () => {
          alert(`Document #${doc.id} has been verified successfully.`);
          this.loadPendingDocuments();
          this.reviewData.verificationNotes = '';
        },
        error: (error) => {
          console.error('Error verifying document:', error);
          alert('Failed to verify document. Please check your Officer ID and try again.');
        }
      });
  }

  rejectDocument(doc: KycDocument): void {
    if (!this.reviewData.officerId) {
      alert('Please enter your Officer User ID before rejecting.');
      return;
    }

    if (!this.reviewData.verificationNotes) {
      alert('Please provide verification notes explaining the reason for rejection.');
      return;
    }

    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    const rejectPayload = {
      documentId: doc.id,
      officerId: parseInt(this.reviewData.officerId),
      status: 'REJECTED',
      verificationNotes: this.reviewData.verificationNotes
    };

    this.http.post(`${this.apiUrl}/kyc/verify`, rejectPayload, { headers })
      .subscribe({
        next: () => {
          alert(`Document #${doc.id} has been rejected.`);
          this.loadPendingDocuments();
          this.reviewData.verificationNotes = '';
        },
        error: (error) => {
          console.error('Error rejecting document:', error);
          alert('Failed to reject document. Please check your Officer ID and try again.');
        }
      });
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('email');
    this.router.navigate(['/auth/login']);
  }
}
