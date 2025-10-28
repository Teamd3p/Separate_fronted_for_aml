import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TransactionService } from '../../../core/services/transaction.service';
import { DashboardService } from '../../../core/services/dashboard.service';
import { Transaction, Account } from '../../../core/models/dashboard.models';

@Component({
  selector: 'app-transactions',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './transactions.html',
  styleUrl: './transactions.css',
})
export class Transactions implements OnInit {
  // Transaction form
  transactionForm = {
    senderAccountNumber: '',
    receiverAccountNumber: '',
    amount: 0,
    description: ''
  };

  // Data
  accounts: Account[] = [];
  transactions: Transaction[] = [];
  filteredTransactions: Transaction[] = [];

  // UI State
  isLoading: boolean = true;
  isSubmitting: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';
  selectedTransaction: Transaction | null = null;

  // Filters
  searchTerm: string = '';
  selectedStatus: string = 'All';
  selectedDateFilter: string = 'Date (Newest)';

  constructor(
    private transactionService: TransactionService,
    private dashboardService: DashboardService
  ) {}

  ngOnInit(): void {
    this.loadInitialData();
  }

  loadInitialData(): void {
    this.isLoading = true;
    this.errorMessage = '';

    // Load accounts
    this.dashboardService.getCustomerAccounts().subscribe({
      next: (accounts) => {
        this.accounts = accounts;
        if (accounts.length > 0) {
          this.transactionForm.senderAccountNumber = accounts[0].accountNumber;
        }
      },
      error: (error) => {
        console.error('Error loading accounts:', error);
      }
    });

    // Load transactions
    this.loadTransactions();
  }

  loadTransactions(): void {
    this.transactionService.getAllTransactions().subscribe({
      next: (response) => {
        this.transactions = response.content || [];
        this.filteredTransactions = [...this.transactions];
        this.isLoading = false;
        this.applyFilters();
      },
      error: (error) => {
        console.error('Error loading transactions:', error);
        this.errorMessage = 'Unable to load transactions. Please try again later.';
        this.isLoading = false;
      }
    });
  }

  submitTransaction(): void {
    // Validation
    if (!this.transactionForm.senderAccountNumber || 
        !this.transactionForm.receiverAccountNumber || 
        !this.transactionForm.amount) {
      this.errorMessage = 'Please fill in all required fields';
      return;
    }

    if (this.transactionForm.amount <= 0) {
      this.errorMessage = 'Amount must be greater than 0';
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';
    this.successMessage = '';

    const transactionData = {
      senderAccountNumber: this.transactionForm.senderAccountNumber,
      receiverAccountNumber: this.transactionForm.receiverAccountNumber,
      amount: this.transactionForm.amount,
      description: this.transactionForm.description
    };

    this.transactionService.createTransaction(transactionData).subscribe({
      next: (newTransaction) => {
        this.successMessage = 'Transaction submitted successfully!';
        this.transactions.unshift(newTransaction);
        this.applyFilters();
        this.resetForm();
        this.isSubmitting = false;
        
        // Clear success message after 5 seconds
        setTimeout(() => {
          this.successMessage = '';
        }, 5000);
      },
      error: (error) => {
        console.error('Error creating transaction:', error);
        this.errorMessage = error.error?.message || 'Failed to submit transaction. Please try again.';
        this.isSubmitting = false;
      }
    });
  }

  resetForm(): void {
    this.transactionForm = {
      senderAccountNumber: this.accounts.length > 0 ? this.accounts[0].accountNumber : '',
      receiverAccountNumber: '',
      amount: 0,
      description: ''
    };
  }

  applyFilters(): void {
    let filtered = [...this.transactions];

    // Search filter
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(t => 
        (t.receiver?.toLowerCase().includes(term)) ||
        (t.description?.toLowerCase().includes(term)) ||
        (t.transactionId?.toLowerCase().includes(term))
      );
    }

    // Status filter
    if (this.selectedStatus !== 'All') {
      filtered = filtered.filter(t => t.status === this.selectedStatus);
    }

    // Date sorting
    if (this.selectedDateFilter === 'Date (Newest)') {
      filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    } else {
      filtered.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }

    this.filteredTransactions = filtered;
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedStatus = 'All';
    this.selectedDateFilter = 'Date (Newest)';
    this.applyFilters();
  }

  viewTransactionDetails(transaction: Transaction): void {
    this.selectedTransaction = transaction;
  }

  closeDetails(): void {
    this.selectedTransaction = null;
  }

  getSelectedAccountDisplay(): string {
    const account = this.accounts.find(a => a.accountNumber === this.transactionForm.senderAccountNumber);
    if (account) {
      return `${account.accountNumber} - ${account.accountType} (${account.currency})`;
    }
    return 'Select account';
  }

  formatCurrency(amount: number, currency: string = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  getStatusClass(status: string): string {
    switch (status?.toUpperCase()) {
      case 'COMPLETED': return 'status-completed';
      case 'PENDING': return 'status-pending';
      case 'BLOCKED': 
      case 'FAILED': return 'status-failed';
      default: return 'status-pending';
    }
  }

  getStatusLabel(status: string): string {
    return status || 'Pending';
  }
}
