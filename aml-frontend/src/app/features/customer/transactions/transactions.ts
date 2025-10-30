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
  selectedTransactionType: string = 'All';
  
  // Form tabs
  activeFormTab: string = 'transfer';
  
  // Additional forms
  depositForm = {
    accountNumber: '',
    amount: 0,
    source: ''
  };
  
  withdrawalForm = {
    accountNumber: '',
    amount: 0,
    purpose: ''
  };

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
        
        // Check if user has no accounts
        if (accounts.length === 0) {
          this.errorMessage = `
            <strong>No Accounts Found</strong><br><br>
            You need to create an account before you can make transactions.<br><br>
            <strong>Note:</strong> You must have at least one verified KYC document to create an account.<br><br>
            <a href="/customer/kyc" style="color: #007AFF; text-decoration: underline;">Verify KYC Documents</a> | 
            <a href="/customer/account" style="color: #007AFF; text-decoration: underline;">Create Account</a>
          `;
          this.isLoading = false;
          return;
        }
        
        if (accounts.length > 0) {
          this.transactionForm.senderAccountNumber = accounts[0].accountNumber;
          this.depositForm.accountNumber = accounts[0].accountNumber;
          this.withdrawalForm.accountNumber = accounts[0].accountNumber;
        }
        
        // Load transactions only if accounts exist
        this.loadTransactions();
      },
      error: (error) => {
        console.error('Error loading accounts:', error);
        
        // Handle KYC verification error
        if (error.status === 403 && error.error?.error === 'KYC Not Verified') {
          this.errorMessage = `
            <strong>KYC Verification Required</strong><br><br>
            ${error.error.message || 'You must verify your KYC documents before accessing accounts.'}<br><br>
            <a href="/customer/kyc" style="color: #007AFF; text-decoration: underline;">Go to KYC Page</a> to upload and verify your documents.
          `;
        } else {
          this.errorMessage = 'Unable to load accounts. Please try again later.';
        }
        this.isLoading = false;
      }
    });
  }

  loadTransactions(): void {
    this.transactionService.getAllTransactions().subscribe({
      next: (response) => {
        this.transactions = response.content || [];
        this.filteredTransactions = [...this.transactions];
        this.isLoading = false;
        
        // Debug: Log the first transaction to see the actual data structure
        if (this.transactions.length > 0) {
          console.log('First transaction data:', this.transactions[0]);
          console.log('Available keys:', Object.keys(this.transactions[0]));
        }
        
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

    // Transaction type filter
    if (this.selectedTransactionType !== 'All') {
      filtered = filtered.filter(transaction => {
        const type = this.getTransactionTypeFromData(transaction);
        
        if (this.selectedTransactionType === 'CREDIT') {
          return type === 'credit';
        } else if (this.selectedTransactionType === 'DEBIT') {
          return type === 'debit';
        } else if (this.selectedTransactionType === 'TRANSFER') {
          return type === 'transfer';
        }
        
        return true;
      });
    }

    // Search filter
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(t => 
        (this.getSenderAccount(t).toLowerCase().includes(term)) ||
        (this.getReceiverAccount(t).toLowerCase().includes(term)) ||
        (this.getReceiverName(t).toLowerCase().includes(term)) ||
        (t.description?.toLowerCase().includes(term)) ||
        (t.transactionId?.toString().toLowerCase().includes(term)) ||
        (t.id?.toString().toLowerCase().includes(term))
      );
    }

    // Status filter
    if (this.selectedStatus !== 'All') {
      filtered = filtered.filter(t => t.status === this.selectedStatus);
    }

    // Date sorting
    if (this.selectedDateFilter === 'Date (Newest)') {
      filtered.sort((a, b) => {
        const dateA = new Date(a.date || a.timestamp || 0).getTime();
        const dateB = new Date(b.date || b.timestamp || 0).getTime();
        return dateB - dateA;
      });
    } else {
      filtered.sort((a, b) => {
        const dateA = new Date(a.date || a.timestamp || 0).getTime();
        const dateB = new Date(b.date || b.timestamp || 0).getTime();
        return dateA - dateB;
      });
    }

    this.filteredTransactions = filtered;
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedStatus = 'All';
    this.selectedDateFilter = 'Date (Newest)';
    this.selectedTransactionType = 'All';
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
    // Handle INR currency specifically
    const currencyCode = currency || 'USD';
    const locale = currencyCode === 'INR' ? 'en-IN' : 'en-US';
    
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currencyCode
    }).format(amount);
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'Invalid Date';
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid Date';
    
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric'
    });
  }

  getStatusClass(status: string): string {
    switch (status?.toUpperCase()) {
      case 'COMPLETED': return 'status-completed';
      case 'PENDING': return 'status-pending';
      case 'BLOCKED': 
      case 'FAILED': return 'status-failed';
      case 'FLAGGED': return 'status-flagged';
      default: return 'status-pending';
    }
  }

  getStatusLabel(status: string): string {
    return status || 'Pending';
  }
  
  // Form tab management
  setFormTab(tab: string): void {
    this.activeFormTab = tab;
    this.errorMessage = '';
    this.successMessage = '';
  }
  
  getTransactionTypeFromData(transaction: Transaction): string {
    // Try to determine transaction type from the data
    if (transaction.transactionType) {
      return transaction.transactionType.toLowerCase();
    }
    
    if (transaction.type) {
      return transaction.type.toLowerCase();
    }
    
    // Fallback logic based on account numbers or description
    const desc = transaction.description?.toLowerCase() || '';
    if (desc.includes('deposit') || desc.includes('salary') || desc.includes('credit')) {
      return 'credit';
    }
    if (desc.includes('withdrawal') || desc.includes('atm') || desc.includes('debit')) {
      return 'debit';
    }
    
    return 'transfer';
  }
  
  getTransactionTypeDisplay(type: string): string {
    switch (type?.toUpperCase()) {
      case 'CREDIT': return 'Deposit';
      case 'DEBIT': return 'Withdrawal';
      case 'TRANSFER': return 'Transfer';
      default: return type || 'Unknown';
    }
  }
  
  // Helper methods to safely get transaction field values
  getSenderAccount(transaction: any): string {
    console.log('Getting sender account for transaction:', transaction);
    
    // Handle null/undefined values explicitly
    const senderAccount = (transaction.senderAccountNumber && transaction.senderAccountNumber !== null) ? transaction.senderAccountNumber :
           (transaction.fromAccount && transaction.fromAccount !== null) ? transaction.fromAccount :
           (transaction.sender_account_number && transaction.sender_account_number !== null) ? transaction.sender_account_number :
           (transaction.sender && transaction.sender !== null) ? transaction.sender :
           (transaction.accountNumber && transaction.accountNumber !== null) ? transaction.accountNumber :
           // For deposit/withdrawal transactions, try to extract from description
           this.extractAccountFromDescription(transaction, 'sender');
    
    console.log('Sender account result:', senderAccount);
    return senderAccount;
  }
  
  getReceiverAccount(transaction: any): string {
    console.log('Getting receiver account for transaction:', transaction);
    
    // Handle null/undefined values explicitly
    const receiverAccount = (transaction.counterpartyAccount && transaction.counterpartyAccount !== null) ? transaction.counterpartyAccount :
           (transaction.receiverAccountNumber && transaction.receiverAccountNumber !== null) ? transaction.receiverAccountNumber :
           (transaction.toAccount && transaction.toAccount !== null) ? transaction.toAccount :
           (transaction.receiver_account_number && transaction.receiver_account_number !== null) ? transaction.receiver_account_number :
           (transaction.counterparty_account && transaction.counterparty_account !== null) ? transaction.counterparty_account :
           (transaction.receiverAccount && transaction.receiverAccount !== null) ? transaction.receiverAccount :
           // For deposit/withdrawal transactions, try to extract from description
           this.extractAccountFromDescription(transaction, 'receiver');
    
    console.log('Receiver account result:', receiverAccount);
    return receiverAccount;
  }
  
  getReceiverName(transaction: any): string {
    console.log('Getting receiver name for transaction:', transaction);
    
    // Handle null/undefined values explicitly
    const receiverName = (transaction.counterpartyName && transaction.counterpartyName !== null) ? transaction.counterpartyName :
           (transaction.receiverName && transaction.receiverName !== null) ? transaction.receiverName :
           (transaction.receiver && transaction.receiver !== null) ? transaction.receiver :
           (transaction.counterparty_name && transaction.counterparty_name !== null) ? transaction.counterparty_name :
           (transaction.receiver_name && transaction.receiver_name !== null) ? transaction.receiver_name :
           (transaction.toName && transaction.toName !== null) ? transaction.toName :
           (transaction.beneficiaryName && transaction.beneficiaryName !== null) ? transaction.beneficiaryName :
           // For deposit/withdrawal, provide meaningful names
           this.getTransactionTypeName(transaction);
    
    console.log('Receiver name result:', receiverName);
    return receiverName;
  }
  
  // Helper method to extract account info from description for deposit/withdrawal
  extractAccountFromDescription(transaction: any, type: 'sender' | 'receiver'): string {
    const description = transaction.description || '';
    const transactionType = transaction.transactionType || '';
    
    // For deposits and withdrawals, we need to infer the account info
    if (transactionType === 'CREDIT' || description.toLowerCase().includes('deposit')) {
      return type === 'sender' ? 'External Source' : 'Your Account';
    } else if (transactionType === 'DEBIT' || description.toLowerCase().includes('withdrawal')) {
      return type === 'sender' ? 'Your Account' : 'External Destination';
    }
    
    return 'N/A';
  }
  
  // Helper method to get meaningful names for transaction types
  getTransactionTypeName(transaction: any): string {
    const transactionType = transaction.transactionType || '';
    const description = transaction.description || '';
    
    if (transactionType === 'CREDIT' || description.toLowerCase().includes('deposit')) {
      return 'External Deposit';
    } else if (transactionType === 'DEBIT' || description.toLowerCase().includes('withdrawal')) {
      return 'Cash Withdrawal';
    } else if (transactionType === 'TRANSFER') {
      return 'Transfer Recipient';
    }
    
    return 'N/A';
  }
  
  // Deposit submission
  submitDeposit(): void {
    if (!this.depositForm.accountNumber || !this.depositForm.amount) {
      this.errorMessage = 'Please fill in all required fields';
      return;
    }

    if (this.depositForm.amount <= 0) {
      this.errorMessage = 'Amount must be greater than 0';
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';
    this.successMessage = '';

    const depositData = {
      accountNumber: this.depositForm.accountNumber,
      amount: this.depositForm.amount,
      description: this.depositForm.source || 'External deposit',
      source: this.depositForm.source || 'External'
    };

    console.log('Submitting deposit:', depositData);

    this.transactionService.createDeposit(depositData).subscribe({
      next: (newTransaction) => {
        console.log('Deposit successful:', newTransaction);
        this.successMessage = 'Deposit processed successfully!';
        this.transactions.unshift(newTransaction);
        this.applyFilters();
        this.resetDepositForm();
        this.isSubmitting = false;
        
        setTimeout(() => {
          this.successMessage = '';
        }, 5000);
      },
      error: (error) => {
        console.error('Deposit failed:', error);
        let errorMessage = 'Failed to process deposit. Please try again.';
        
        if (error.error?.message) {
          errorMessage = error.error.message;
        } else if (error.message) {
          errorMessage = error.message;
        } else if (error.status === 403) {
          errorMessage = 'Access denied. Please check your account permissions.';
        } else if (error.status === 400) {
          errorMessage = 'Invalid deposit request. Please check your input.';
        }
        
        this.errorMessage = errorMessage;
        this.isSubmitting = false;
      }
    });
  }
  
  // Withdrawal submission
  submitWithdrawal(): void {
    if (!this.withdrawalForm.accountNumber || !this.withdrawalForm.amount) {
      this.errorMessage = 'Please fill in all required fields';
      return;
    }

    if (this.withdrawalForm.amount <= 0) {
      this.errorMessage = 'Amount must be greater than 0';
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';
    this.successMessage = '';

    const withdrawalData = {
      accountNumber: this.withdrawalForm.accountNumber,
      amount: this.withdrawalForm.amount,
      description: this.withdrawalForm.purpose || 'Cash withdrawal',
      purpose: this.withdrawalForm.purpose || 'Personal use'
    };

    console.log('Submitting withdrawal:', withdrawalData);

    this.transactionService.createWithdrawal(withdrawalData).subscribe({
      next: (newTransaction) => {
        console.log('Withdrawal successful:', newTransaction);
        this.successMessage = 'Withdrawal processed successfully!';
        this.transactions.unshift(newTransaction);
        this.applyFilters();
        this.resetWithdrawalForm();
        this.isSubmitting = false;
        
        setTimeout(() => {
          this.successMessage = '';
        }, 5000);
      },
      error: (error) => {
        console.error('Withdrawal failed:', error);
        let errorMessage = 'Failed to process withdrawal. Please try again.';
        
        if (error.error?.message) {
          errorMessage = error.error.message;
        } else if (error.message) {
          errorMessage = error.message;
        } else if (error.status === 403) {
          errorMessage = 'Access denied. Please check your account permissions.';
        } else if (error.status === 400) {
          errorMessage = 'Invalid withdrawal request. Please check your input.';
        }
        
        this.errorMessage = errorMessage;
        this.isSubmitting = false;
      }
    });
  }
  
  resetDepositForm(): void {
    this.depositForm = {
      accountNumber: this.accounts.length > 0 ? this.accounts[0].accountNumber : '',
      amount: 0,
      source: ''
    };
  }
  
  resetWithdrawalForm(): void {
    this.withdrawalForm = {
      accountNumber: this.accounts.length > 0 ? this.accounts[0].accountNumber : '',
      amount: 0,
      purpose: ''
    };
  }
}
