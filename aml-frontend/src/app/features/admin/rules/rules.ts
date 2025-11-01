import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { RuleService } from '../../../core/services/rule.service';
import { Rule, RuleCreateRequest, RuleUpdateRequest } from '../../../core/models/rule.models';
import { ToastService } from '../../../core/services/toast.service';
import { ConfirmationDialogService } from '../../../core/services/confirmation-dialog.service';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';

// Field configuration interfaces
interface RuleFieldConfig {
  name: string;
  label: string;
  type: 'number' | 'text' | 'select';
  required: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
  min?: number;
  max?: number;
  description?: string;
}

interface RuleTypeConfig {
  fields: RuleFieldConfig[];
  description: string;
}

@Component({
  selector: 'app-rules',
  standalone: true,
  imports: [CommonModule, FormsModule, PaginationComponent],
  templateUrl: './rules.html',
  styleUrl: './rules.css',
})
export class Rules implements OnInit {
  rules: Rule[] = [];
  filteredRules: Rule[] = [];
  loading: boolean = false;
  searchTerm: string = '';
  
  // Statistics
  totalRules: number = 0;
  activeRules: number = 0;
  inactiveRules: number = 0;
  
  // Filter states
  typeFilter: string = 'all';
  statusFilter: string = 'all';
  
  // Pagination
  currentPage: number = 1;
  pageSize: number = 10;
  pageSizeOptions: number[] = [10, 25, 50, 100];
  
  // Modal states
  showAddModal: boolean = false;
  showEditModal: boolean = false;
  showDeleteModal: boolean = false;
  showViewModal: boolean = false;
  
  // Form data
  newRule: RuleCreateRequest = {
    name: '',
    type: 'PATTERN',
    impact: 50,
    description: '',
    condition: ''
  };
  
  editRule: RuleUpdateRequest = {};
  selectedRule: Rule | null = null;
  
  // Form validation
  formErrors: any = {};
  isSubmitting: boolean = false;
  
  // Dynamic form fields
  dynamicFormFields: any = {};
  editDynamicFormFields: any = {};
  
  // Rule type configurations
  ruleTypeConfigs: { [key: string]: RuleTypeConfig } = {
    'THRESHOLD': {
      description: 'Detects large or specific type transactions exceeding set threshold(s)',
      fields: [
        {
          name: 'amountThreshold',
          label: 'Amount Threshold',
          type: 'number',
          required: false,
          placeholder: '100000',
          description: 'Minimum transaction amount that triggers the rule (use this OR min/max amount)'
        },
        {
          name: 'minAmount',
          label: 'Minimum Amount',
          type: 'number',
          required: false,
          placeholder: '50000',
          description: 'Minimum amount for range-based checks'
        },
        {
          name: 'maxAmount',
          label: 'Maximum Amount',
          type: 'number',
          required: false,
          placeholder: '200000',
          description: 'Maximum amount for range-based checks'
        },
        {
          name: 'currency',
          label: 'Currency',
          type: 'select',
          required: false,
          options: [
            { value: '', label: 'Select Currency' },
            { value: 'ANY', label: 'ANY (All Currencies)' },
            { value: 'INR', label: 'INR' },
            { value: 'USD', label: 'USD' },
            { value: 'EUR', label: 'EUR' },
            { value: 'GBP', label: 'GBP' }
          ],
          description: 'Currency to which rule applies'
        },
        {
          name: 'transactionType',
          label: 'Transaction Type',
          type: 'select',
          required: false,
          options: [
            { value: '', label: 'Select Type' },
            { value: 'CREDIT', label: 'CREDIT' },
            { value: 'DEBIT', label: 'DEBIT' },
            { value: 'TRANSFER', label: 'TRANSFER' },
            { value: 'DEPOSIT', label: 'DEPOSIT' }
          ],
          description: 'Restricts rule to a particular transaction type'
        }
      ]
    },
    'FREQUENCY': {
      description: 'Detects multiple transactions by same customer in short time (burst activity)',
      fields: [
        {
          name: 'maxTransactions',
          label: 'Max Transactions',
          type: 'number',
          required: true,
          placeholder: '5',
          min: 1,
          description: 'Maximum number of allowed transactions in the time window'
        },
        {
          name: 'timeWindowMinutes',
          label: 'Time Window (Minutes)',
          type: 'number',
          required: true,
          placeholder: '60',
          min: 1,
          description: 'Time window in minutes to check transaction frequency'
        }
      ]
    },
    'VELOCITY': {
      description: 'Detects fast-moving (high frequency + amount) transactions above a limit',
      fields: [
        {
          name: 'minAmount',
          label: 'Minimum Amount',
          type: 'number',
          required: true,
          placeholder: '10000',
          description: 'Minimum amount to consider for velocity checks'
        },
        {
          name: 'maxTransactions',
          label: 'Max Transactions',
          type: 'number',
          required: true,
          placeholder: '3',
          min: 1,
          description: 'Maximum number of transactions allowed'
        },
        {
          name: 'timeWindowMinutes',
          label: 'Time Window (Minutes)',
          type: 'number',
          required: true,
          placeholder: '120',
          min: 1,
          description: 'Time window in minutes for velocity analysis'
        }
      ]
    },
    'FUNNEL_ACCOUNT': {
      description: 'Detects many senders funneling to one receiver (typical of money laundering)',
      fields: [
        {
          name: 'minSenders',
          label: 'Minimum Senders',
          type: 'number',
          required: true,
          placeholder: '5',
          min: 1,
          description: 'Minimum number of unique senders sending to the same receiver'
        },
        {
          name: 'timeWindowMinutes',
          label: 'Time Window (Minutes)',
          type: 'number',
          required: true,
          placeholder: '60',
          min: 1,
          description: 'Time window in minutes for funnel detection'
        }
      ]
    },
    'GEOGRAPHIC': {
      description: 'Detects transactions involving risky countries (based on country risk level DB)',
      fields: [
        {
          name: 'highRiskAmountThreshold',
          label: 'High Risk Amount Threshold',
          type: 'number',
          required: false,
          placeholder: '50000',
          description: 'Amount threshold for high-risk countries'
        },
        {
          name: 'mediumRiskAmountThreshold',
          label: 'Medium Risk Amount Threshold',
          type: 'number',
          required: false,
          placeholder: '500000',
          description: 'Amount threshold for medium-risk countries'
        }
      ]
    },
    'KEYWORD': {
      description: 'Detects suspicious words/phrases in transaction descriptions (uses keywords from DB)',
      fields: []
    },
    'PATTERN': {
      description: 'Detects patterns using regex in transaction fields',
      fields: [
        {
          name: 'regex',
          label: 'Regular Expression',
          type: 'text',
          required: true,
          placeholder: '(?i)bribe|illegal|smurf',
          description: 'Regex pattern to match in transaction field'
        },
        {
          name: 'field',
          label: 'Field to Match',
          type: 'select',
          required: false,
          options: [
            { value: '', label: 'Default (description)' },
            { value: 'description', label: 'Description' },
            { value: 'amount', label: 'Amount' }
          ],
          description: 'Transaction field where regex will be applied'
        }
      ]
    }
  };

  constructor(
    private ruleService: RuleService,
    private router: Router,
    private toastService: ToastService,
    private confirmationService: ConfirmationDialogService
  ) {}

  ngOnInit(): void {
    this.loadRules();
  }

  // Add sample data for testing
  private addSampleData(): void {
    this.rules = [
      {
        id: 1,
        name: 'Rapid Transactions 10m',
        type: 'FREQUENCY',
        impact: 75,
        isActive: true,
        description: 'Detects rapid transaction patterns within 10 minutes',
        condition: '{"field": "transaction_count", "operator": ">", "value": 5}',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 2,
        name: 'High Risk Geographic Location',
        type: 'GEOGRAPHIC',
        impact: 85,
        isActive: true,
        description: 'Flags transactions from high-risk countries',
        condition: '{"sourceTable": "high_risk_countries", "filter": {"status": "active"}}',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 3,
        name: 'Suspicious Keywords Detection',
        type: 'KEYWORD',
        impact: 60,
        isActive: false,
        description: 'Scans transaction descriptions for suspicious terms',
        condition: '{"regex": "(?i)\\b(cash|money|transfer)\\b", "field": "description"}',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 4,
        name: 'Large Amount Threshold',
        type: 'THRESHOLD',
        impact: 90,
        isActive: true,
        description: 'Triggers on transactions above specified amount',
        condition: '{"regex": "^[1-9][0-9]*0{4,}$", "field": "amount"}',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
    this.updateStatistics();
    this.applyFilters();
  }

  // Load rules from API
  loadRules(): void {
    this.loading = true;
    this.ruleService.getRules().subscribe({
      next: (rules) => {
        this.rules = rules;
        this.updateStatistics();
        this.applyFilters();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading rules:', error);
        this.loading = false;
        this.rules = [];
        this.filteredRules = [];
        
        let errorMessage = 'Failed to load rules. ';
        if (error.status === 0) {
          errorMessage += 'Please check if the backend server is running.';
        } else if (error.status === 401) {
          errorMessage += 'Please login again.';
        } else if (error.status === 403) {
          errorMessage += 'You do not have permission to view rules.';
        } else if (error.status === 404) {
          errorMessage += 'Rules endpoint not found.';
        } else {
          errorMessage += `Server error: ${error.status}`;
        }
        
        this.showErrorMessage(errorMessage);
      }
    });
  }

  // Update statistics
  updateStatistics(): void {
    this.totalRules = this.rules.length;
    this.activeRules = this.rules.filter(r => r.isActive).length;
    this.inactiveRules = this.rules.filter(r => !r.isActive).length;
  }

  // Search and filter functionality
  onSearchChange(): void {
    this.applyFilters();
  }
  
  onFilterChange(): void {
    this.applyFilters();
  }
  
  applyFilters(): void {
    let filtered = [...this.rules];
    
    // Search filter
    if (this.searchTerm.trim()) {
      const searchLower = this.searchTerm.toLowerCase();
      filtered = filtered.filter(rule =>
        rule.name.toLowerCase().includes(searchLower) ||
        rule.type.toLowerCase().includes(searchLower)
      );
    }
    
    // Type filter
    if (this.typeFilter !== 'all') {
      filtered = filtered.filter(rule => rule.type === this.typeFilter);
    }
    
    // Status filter
    if (this.statusFilter !== 'all') {
      const isActive = this.statusFilter === 'active';
      filtered = filtered.filter(rule => rule.isActive === isActive);
    }
    
    this.filteredRules = filtered;
    this.currentPage = 1; // Reset to first page when filters change
  }
  
  // Pagination methods
  getPaginatedRules(): Rule[] {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    return this.filteredRules.slice(startIndex, endIndex);
  }
  
  getTotalPages(): number {
    return Math.ceil(this.filteredRules.length / this.pageSize);
  }
  
  getPageNumbers(): number[] {
    const totalPages = this.getTotalPages();
    const pages: number[] = [];
    const maxPagesToShow = 5;
    
    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      const startPage = Math.max(1, this.currentPage - 2);
      const endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
      
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
    }
    
    return pages;
  }
  
  goToPage(page: number): void {
    if (page >= 1 && page <= this.getTotalPages()) {
      this.currentPage = page;
    }
  }
  
  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }
  
  nextPage(): void {
    if (this.currentPage < this.getTotalPages()) {
      this.currentPage++;
    }
  }
  
  onPageSizeChange(): void {
    this.currentPage = 1; // Reset to first page when page size changes
  }

  // Modal management
  openAddModal(): void {
    this.newRule = {
      name: '',
      type: 'PATTERN',
      impact: 50,
      description: '',
      condition: ''
    };
    this.dynamicFormFields = {};
    this.formErrors = {};
    this.showAddModal = true;
  }

  openEditModal(rule: Rule): void {
    this.closeModals(); // Close any open modals first
    this.selectedRule = rule;
    
    // Ensure we have the complete rule data
    const condition = rule.condition || '';
    const description = rule.description || '';
    
    this.editRule = {
      name: rule.name,
      type: rule.type,
      impact: rule.impact,
      isActive: rule.isActive,
      description: description,
      condition: condition
    };
    
    // Parse existing condition to populate dynamic form fields
    this.editDynamicFormFields = {};
    if (condition && condition.trim()) {
      try {
        const parsed = JSON.parse(condition);
        this.editDynamicFormFields = { ...parsed };
      } catch (e) {
        console.error('Failed to parse condition:', e);
      }
    }
    
    this.formErrors = {};
    this.showEditModal = true;
  }

  openViewModal(rule: Rule): void {
    this.selectedRule = rule;
    this.showViewModal = true;
  }

  openDeleteModal(rule: Rule): void {
    this.selectedRule = rule;
    this.showDeleteModal = true;
  }

  closeModals(): void {
    this.showAddModal = false;
    this.showEditModal = false;
    this.showDeleteModal = false;
    this.showViewModal = false;
    this.selectedRule = null;
    this.dynamicFormFields = {};
    this.editDynamicFormFields = {};
    this.formErrors = {};
    this.isSubmitting = false;
  }

  // CRUD Operations
  createRule(): void {
    // Generate JSON condition from dynamic form fields
    this.newRule.condition = this.generateConditionJson(this.newRule.type, this.dynamicFormFields);
    
    if (!this.validateRuleForm(this.newRule)) {
      return;
    }

    this.isSubmitting = true;
    this.ruleService.createRule(this.newRule).subscribe({
      next: (rule) => {
        this.rules.push(rule);
        this.updateStatistics();
        this.applyFilters();
        this.closeModals();
        this.showSuccessMessage('Rule created successfully');
      },
      error: (error) => {
        console.error('Error creating rule:', error);
        this.isSubmitting = false;
        const errorMsg = error.error?.message || error.message || 'Unknown error';
        this.showErrorMessage(`Failed to create rule: ${errorMsg}`);
      }
    });
  }

  updateRule(): void {
    if (!this.selectedRule) {
      return;
    }
    
    // Generate JSON condition from dynamic form fields
    this.editRule.condition = this.generateConditionJson(this.editRule.type!, this.editDynamicFormFields);
    
    if (!this.validateRuleForm(this.editRule)) {
      return;
    }

    this.isSubmitting = true;
    this.ruleService.updateRule(this.selectedRule.id, this.editRule).subscribe({
      next: (updatedRule) => {
        const index = this.rules.findIndex(r => r.id === updatedRule.id);
        if (index !== -1) {
          this.rules[index] = updatedRule;
        }
        this.updateStatistics();
        this.applyFilters();
        this.closeModals();
        this.showSuccessMessage('Rule updated successfully');
      },
      error: (error) => {
        console.error('Error updating rule:', error);
        this.isSubmitting = false;
        const errorMsg = error.error?.message || error.message || 'Unknown error';
        this.showErrorMessage(`Failed to update rule: ${errorMsg}`);
      }
    });
  }

  deleteRule(): void {
    if (!this.selectedRule) return;

    // Show confirmation dialog
    this.confirmationService.confirm({
      title: 'Delete Rule',
      message: `Are you sure you want to delete the rule "${this.selectedRule.name}"? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      type: 'danger'
    }).subscribe(confirmed => {
      if (!confirmed) {
        this.closeModals();
        return;
      }

      this.isSubmitting = true;
      this.ruleService.deleteRule(this.selectedRule!.id).subscribe({
        next: () => {
          this.rules = this.rules.filter(r => r.id !== this.selectedRule!.id);
          this.updateStatistics();
          this.applyFilters();
          this.closeModals();
          this.showSuccessMessage('Rule deleted successfully');
        },
        error: (error) => {
          console.error('Error deleting rule:', error);
          this.isSubmitting = false;
          const errorMsg = error.error?.message || error.message || 'Unknown error';
          this.showErrorMessage(`Failed to delete rule: ${errorMsg}`);
        }
      });
    });
  }

  toggleRuleStatus(rule: Rule): void {
    const newStatus = !rule.isActive;
    const action = newStatus ? 'activate' : 'deactivate';
    
    // Show confirmation dialog
    this.confirmationService.confirm({
      title: `${action.charAt(0).toUpperCase() + action.slice(1)} Rule`,
      message: `Are you sure you want to ${action} the rule "${rule.name}"?`,
      confirmText: action.charAt(0).toUpperCase() + action.slice(1),
      cancelText: 'Cancel',
      type: newStatus ? 'info' : 'warning'
    }).subscribe(confirmed => {
      if (!confirmed) return;
      
      // Use update endpoint with all data, just changing status
      const updatedRuleData = {
        ...rule,
        isActive: newStatus
      };
      
      this.ruleService.updateRule(rule.id, updatedRuleData).subscribe({
        next: (updatedRule) => {
          const index = this.rules.findIndex(r => r.id === updatedRule.id);
          if (index !== -1) {
            this.rules[index] = updatedRule;
          }
          this.updateStatistics();
          this.applyFilters();
          this.showSuccessMessage(`Rule ${newStatus ? 'activated' : 'deactivated'} successfully`);
        },
        error: (error) => {
          console.error('Error updating rule status:', error);
          const errorMsg = error.error?.message || error.message || 'Unknown error';
          this.showErrorMessage(`Failed to update rule status: ${errorMsg}`);
        }
      });
    });
  }

  // Form validation
  private validateRuleForm(rule: any): boolean {
    this.formErrors = {};
    let isValid = true;

    // Name validation
    if (!rule.name || rule.name.trim().length === 0) {
      this.formErrors.name = 'Rule name is required';
      isValid = false;
    } else if (rule.name.trim().length < 3) {
      this.formErrors.name = 'Rule name must be at least 3 characters';
      isValid = false;
    } else if (rule.name.trim().length > 100) {
      this.formErrors.name = 'Rule name must be less than 100 characters';
      isValid = false;
    }

    // Type validation
    if (!rule.type) {
      this.formErrors.type = 'Rule type is required';
      isValid = false;
    }

    // Impact validation
    if (rule.impact === null || rule.impact === undefined || rule.impact < 0 || rule.impact > 100) {
      this.formErrors.impact = 'Impact must be between 0 and 100';
      isValid = false;
    }

    // Description validation
    if (rule.description && rule.description.length > 500) {
      this.formErrors.description = 'Description must be less than 500 characters';
      isValid = false;
    }

    // Condition validation
    if (rule.condition && rule.condition.trim().length > 0) {
      if (!this.validateConditionFormat(rule.condition)) {
        this.formErrors.condition = 'Invalid condition format. Use JSON format like: {"regex": "pattern", "field": "fieldName"}';
        isValid = false;
      }
    }
    
    // Validate dynamic fields (for add/edit forms)
    const formFields = this.showAddModal ? this.dynamicFormFields : this.editDynamicFormFields;
    if (!this.validateDynamicFields(rule.type, formFields)) {
      isValid = false;
    }

    return isValid;
  }

  // Validate condition JSON format based on rule engine specifications
  private validateConditionFormat(condition: string): boolean {
    try {
      const parsed = JSON.parse(condition);
      
      // Check if it's a valid condition object
      if (typeof parsed === 'object' && parsed !== null) {
        
        // THRESHOLD Rules - Amount-based conditions
        if (parsed.amountThreshold !== undefined) {
          const isValidAmount = typeof parsed.amountThreshold === 'number' || 
                               (typeof parsed.amountThreshold === 'string' && !isNaN(Number(parsed.amountThreshold)));
          if (!isValidAmount) return false;
        }
        
        if (parsed.minAmount !== undefined) {
          const isValidAmount = typeof parsed.minAmount === 'number' || 
                               (typeof parsed.minAmount === 'string' && !isNaN(Number(parsed.minAmount)));
          if (!isValidAmount) return false;
        }
        
        if (parsed.maxAmount !== undefined) {
          const isValidAmount = typeof parsed.maxAmount === 'number' || 
                               (typeof parsed.maxAmount === 'string' && !isNaN(Number(parsed.maxAmount)));
          if (!isValidAmount) return false;
        }
        
        // Currency validation
        if (parsed.currency !== undefined) {
          const validCurrencies = ['USD', 'EUR', 'INR', 'GBP', 'ANY'];
          if (typeof parsed.currency !== 'string' || !validCurrencies.includes(parsed.currency.toUpperCase())) {
            return false;
          }
        }
        
        // Transaction type validation
        if (parsed.transactionType !== undefined) {
          const validTypes = ['DEBIT', 'CREDIT', 'TRANSFER', 'DEPOSIT'];
          if (typeof parsed.transactionType !== 'string' || !validTypes.includes(parsed.transactionType.toUpperCase())) {
            return false;
          }
        }
        
        // GEOGRAPHIC Rules
        if (parsed.highRiskAmountThreshold !== undefined || parsed.mediumRiskAmountThreshold !== undefined) {
          if (parsed.highRiskAmountThreshold !== undefined) {
            const isValid = typeof parsed.highRiskAmountThreshold === 'number' || 
                           (typeof parsed.highRiskAmountThreshold === 'string' && !isNaN(Number(parsed.highRiskAmountThreshold)));
            if (!isValid) return false;
          }
          if (parsed.mediumRiskAmountThreshold !== undefined) {
            const isValid = typeof parsed.mediumRiskAmountThreshold === 'number' || 
                           (typeof parsed.mediumRiskAmountThreshold === 'string' && !isNaN(Number(parsed.mediumRiskAmountThreshold)));
            if (!isValid) return false;
          }
        }
        
        // FREQUENCY Rules
        if (parsed.maxTransactions !== undefined) {
          if (typeof parsed.maxTransactions !== 'number' || parsed.maxTransactions < 0) return false;
        }
        
        if (parsed.timeWindowMinutes !== undefined) {
          if (typeof parsed.timeWindowMinutes !== 'number' || parsed.timeWindowMinutes < 0) return false;
        }
        
        // VELOCITY Rules (same as frequency but with minAmount)
        if (parsed.minAmount !== undefined && parsed.timeWindowMinutes !== undefined && parsed.maxTransactions !== undefined) {
          // Already validated above
        }
        
        // PATTERN Rules
        if (parsed.regex !== undefined) {
          if (typeof parsed.regex !== 'string') return false;
          // Validate field if present
          if (parsed.field !== undefined) {
            const validFields = ['description', 'amount'];
            if (typeof parsed.field !== 'string' || !validFields.includes(parsed.field.toLowerCase())) {
              return false;
            }
          }
        }
        
        // FUNNEL_ACCOUNT Rules
        if (parsed.minSenders !== undefined) {
          if (typeof parsed.minSenders !== 'number' || parsed.minSenders < 0) return false;
        }
        
        // KEYWORD and KYC Rules (empty objects are valid)
        if (Object.keys(parsed).length === 0) {
          return true; // Empty object is valid for KEYWORD and KYC rules
        }
        
        return true; // Valid if passes all checks
      }
      
      return false;
    } catch (e) {
      return false;
    }
  }

  // Utility methods
  getTypeBadgeClass(type: string): string {
    switch (type) {
      case 'THRESHOLD': return 'type-badge threshold';
      case 'GEOGRAPHIC': return 'type-badge geographic';
      case 'FREQUENCY': return 'type-badge frequency';
      case 'KEYWORD': return 'type-badge keyword';
      case 'PATTERN': return 'type-badge pattern';
      case 'GRAPH_BEHAVIOR': return 'type-badge graph-behavior';
      case 'GRAPH_PATTERN': return 'type-badge graph-pattern';
      case 'VELOCITY': return 'type-badge velocity';
      case 'BEHAVIOR': return 'type-badge behavior';
      case 'KYC': return 'type-badge kyc';
      case 'NETWORK': return 'type-badge network';
      case 'CASH_WIRE_VELOCITY': return 'type-badge cash-wire-velocity';
      case 'FUNNEL_ACCOUNT': return 'type-badge funnel-account';
      default: return 'type-badge pattern';
    }
  }

  getStatusBadgeClass(isActive: boolean): string {
    return isActive ? 'status-badge active' : 'status-badge inactive';
  }

  // Format JSON condition for display
  formatJsonCondition(condition: string): string {
    if (!condition || condition.trim() === '') {
      return 'No condition specified';
    }
    
    try {
      const parsed = JSON.parse(condition);
      return JSON.stringify(parsed, null, 2);
    } catch (e) {
      return condition; // Return as-is if not valid JSON
    }
  }

  // Handle condition input change for live preview
  onConditionChange(): void {
    // This method is called when the condition textarea changes
    // The preview will automatically update due to Angular's change detection
  }

  // Get condition hints based on rule type
  getConditionHints(ruleType: string): string[] {
    switch (ruleType) {
      case 'THRESHOLD':
        return [
          '{"amountThreshold": 50000, "currency": "USD"}',
          '{"minAmount": 9000, "maxAmount": 10000, "currency": "ANY"}',
          '{"amountThreshold": 100000, "transactionType": "TRANSFER"}'
        ];
      case 'GEOGRAPHIC':
        return [
          '{"highRiskAmountThreshold": 25000, "mediumRiskAmountThreshold": 250000}',
          '{"highRiskAmountThreshold": 10000}'
        ];
      case 'FREQUENCY':
        return [
          '{"maxTransactions": 5, "timeWindowMinutes": 60}',
          '{"maxTransactions": 10, "timeWindowMinutes": 1440}'
        ];
      case 'VELOCITY':
        return [
          '{"timeWindowMinutes": 30, "minAmount": 1000, "maxTransactions": 3}',
          '{"timeWindowMinutes": 60, "minAmount": 5000, "maxTransactions": 2}'
        ];
      case 'PATTERN':
        return [
          '{"regex": "cash.*deposit", "field": "description"}',
          '{"regex": "\\\\d{4,}", "field": "amount"}',
          '{"regex": "wire.*transfer|money.*order"}'
        ];
      case 'FUNNEL_ACCOUNT':
        return [
          '{"minSenders": 5, "timeWindowMinutes": 60}',
          '{"minSenders": 10, "timeWindowMinutes": 1440}'
        ];
      case 'KEYWORD':
      case 'KYC':
        return ['{}'];
      default:
        return ['{}'];
    }
  }

  showSuccessMessage(message: string): void {
    this.toastService.success(message);
  }

  showErrorMessage(message: string): void {
    this.toastService.error(message);
  }
  
  // Dynamic form field methods
  getRuleTypeConfig(ruleType: string): RuleTypeConfig | null {
    return this.ruleTypeConfigs[ruleType] || null;
  }
  
  onRuleTypeChange(isEditMode: boolean = false): void {
    // Clear dynamic form fields when rule type changes
    if (isEditMode) {
      this.editDynamicFormFields = {};
    } else {
      this.dynamicFormFields = {};
    }
  }
  
  generateConditionJson(ruleType: string, formFields: any): string {
    const config = this.getRuleTypeConfig(ruleType);
    
    // For KEYWORD and KYC rules, return empty object
    if (!config || config.fields.length === 0) {
      return '{}';
    }
    
    const condition: any = {};
    
    // Build condition object from form fields
    config.fields.forEach(field => {
      const value = formFields[field.name];
      
      // Only include non-empty values
      if (value !== undefined && value !== null && value !== '') {
        if (field.type === 'number') {
          condition[field.name] = Number(value);
        } else {
          condition[field.name] = value;
        }
      }
    });
    
    return JSON.stringify(condition);
  }
  
  getGeneratedConditionPreview(ruleType: string, formFields: any): string {
    try {
      const json = this.generateConditionJson(ruleType, formFields);
      const parsed = JSON.parse(json);
      return JSON.stringify(parsed, null, 2);
    } catch (e) {
      return '{}';
    }
  }
  
  validateDynamicFields(ruleType: string, formFields: any): boolean {
    const config = this.getRuleTypeConfig(ruleType);
    if (!config) return true;
    
    let isValid = true;
    
    // Check required fields
    config.fields.forEach(field => {
      if (field.required) {
        const value = formFields[field.name];
        if (value === undefined || value === null || value === '') {
          this.formErrors[field.name] = `${field.label} is required`;
          isValid = false;
        }
      }
    });
    
    // Special validation for THRESHOLD rule
    if (ruleType === 'THRESHOLD') {
      const hasAmountThreshold = formFields['amountThreshold'] !== undefined && 
                                 formFields['amountThreshold'] !== null && 
                                 formFields['amountThreshold'] !== '';
      const hasMinAmount = formFields['minAmount'] !== undefined && 
                          formFields['minAmount'] !== null && 
                          formFields['minAmount'] !== '';
      const hasMaxAmount = formFields['maxAmount'] !== undefined && 
                          formFields['maxAmount'] !== null && 
                          formFields['maxAmount'] !== '';
      
      if (!hasAmountThreshold && !hasMinAmount && !hasMaxAmount) {
        this.formErrors['amountThreshold'] = 'At least one of Amount Threshold, Min Amount, or Max Amount is required';
        isValid = false;
      }
    }
    
    return isValid;
  }

  // Navigation methods
  navigateTo(route: string): void {
    this.router.navigate([route]);
  }

  logout(): void {
    localStorage.removeItem('token');
    this.router.navigate(['/login']);
  }
}
