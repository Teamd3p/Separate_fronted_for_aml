import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ComplianceService, Transaction as ComplianceTransaction } from '../../../core/services/compliance.service';

// Use ComplianceTransaction type
type Transaction = ComplianceTransaction;

interface PagedResponse {
  content: Transaction[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

@Component({
  selector: 'app-transactions',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './transactions.html',
  styleUrl: './transactions.css',
})
export class Transactions implements OnInit {
  allTransactions: Transaction[] = [];
  transactions: Transaction[] = [];
  isLoading = false;
  errorMessage = '';
  
  // Modal
  showDetailsModal = false;
  selectedTransaction: Transaction | null = null;
  
  // Pagination
  currentPage = 0;
  pageSize = 20;
  totalPages = 0;
  totalElements = 0;
  
  // Filters
  searchQuery = '';
  filterType = 'all';
  filterStatus = 'all';
  sortBy = 'timestamp';
  sortOrder = 'desc';

  constructor(private complianceService: ComplianceService) {}

  ngOnInit(): void {
    this.loadTransactions();
  }

  loadTransactions(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.complianceService.getAllTransactions(this.currentPage, this.pageSize).subscribe({
      next: (response: any) => {
        // Backend returns array directly, not PagedResponse
        if (Array.isArray(response)) {
          this.allTransactions = response;
          this.totalElements = response.length;
          // Client-side pagination
          this.totalPages = Math.ceil(this.totalElements / this.pageSize);
        } else {
          this.allTransactions = [];
        }
        this.applyFilters();
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error loading transactions:', error);
        this.errorMessage = 'Failed to load transactions';
        this.isLoading = false;
      }
    });
  }

  applyFilters(): void {
    let filtered = [...this.allTransactions];
    
    // Filter by type
    if (this.filterType !== 'all') {
      filtered = filtered.filter(t => t.transactionType === this.filterType);
    }
    
    // Filter by status
    if (this.filterStatus !== 'all') {
      filtered = filtered.filter(t => t.status === this.filterStatus);
    }
    
    // Search filter
    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(t => 
        t.transactionId.toString().includes(query) ||
        t.customerName?.toLowerCase().includes(query) ||
        t.customerEmail?.toLowerCase().includes(query) ||
        t.senderAccountNumber?.toLowerCase().includes(query) ||
        t.counterpartyAccount?.toLowerCase().includes(query) ||
        t.counterpartyName?.toLowerCase().includes(query)
      );
    }
    
    this.transactions = filtered;
    this.totalElements = filtered.length;
    this.totalPages = Math.ceil(this.totalElements / this.pageSize);
  }

  onFilterChange(): void {
    this.currentPage = 0;
    this.loadTransactions();
  }

  goToPage(page: number): void {
    if (page >= 0 && page < this.totalPages) {
      this.currentPage = page;
      this.loadTransactions();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages - 1) {
      this.currentPage++;
      this.loadTransactions();
    }
  }

  previousPage(): void {
    if (this.currentPage > 0) {
      this.currentPage--;
      this.loadTransactions();
    }
  }

  getStatusClass(status: string): string {
    const statusMap: any = {
      'COMPLETED': 'status-completed',
      'PENDING': 'status-pending',
      'FAILED': 'status-failed',
      'FLAGGED': 'status-flagged'
    };
    return statusMap[status] || 'status-pending';
  }

  getTypeClass(type: string): string {
    const typeMap: any = {
      'TRANSFER': 'type-transfer',
      'DEPOSIT': 'type-deposit',
      'WITHDRAWAL': 'type-withdrawal'
    };
    return typeMap[type] || 'type-transfer';
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxPages = 5;
    let startPage = Math.max(0, this.currentPage - Math.floor(maxPages / 2));
    let endPage = Math.min(this.totalPages - 1, startPage + maxPages - 1);
    
    if (endPage - startPage < maxPages - 1) {
      startPage = Math.max(0, endPage - maxPages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return pages;
  }

  viewTransactionDetails(transaction: Transaction): void {
    this.selectedTransaction = transaction;
    this.showDetailsModal = true;
  }

  closeDetailsModal(): void {
    this.showDetailsModal = false;
    this.selectedTransaction = null;
  }
}
