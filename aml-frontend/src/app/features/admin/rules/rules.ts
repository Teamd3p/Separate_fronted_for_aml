import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { RuleService } from '../../../core/services/rule.service';
import { Rule, RuleCreateRequest, RuleUpdateRequest } from '../../../core/models/rule.models';

@Component({
  selector: 'app-rules',
  standalone: true,
  imports: [CommonModule, FormsModule],
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

  @ViewChild('editConditionTextarea') editConditionTextarea!: ElementRef<HTMLTextAreaElement>;

  constructor(
    private ruleService: RuleService,
    private router: Router
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
    this.formErrors = {};
    
    this.showEditModal = true;
    
    // Ensure textarea value is set after modal is rendered
    setTimeout(() => {
      if (this.editConditionTextarea && this.editConditionTextarea.nativeElement) {
        this.editConditionTextarea.nativeElement.value = condition;
        // Trigger input event to update ngModel
        const event = new Event('input', { bubbles: true });
        this.editConditionTextarea.nativeElement.dispatchEvent(event);
      }
    }, 100);
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
    this.formErrors = {};
    this.isSubmitting = false;
  }

  // CRUD Operations
  createRule(): void {
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

    this.isSubmitting = true;
    this.ruleService.deleteRule(this.selectedRule.id).subscribe({
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
  }

  toggleRuleStatus(rule: Rule): void {
    const newStatus = !rule.isActive;
    this.ruleService.toggleRuleStatus(rule.id, newStatus).subscribe({
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
    console.log('Success:', message);
    alert(message); // Temporary solution
  }

  showErrorMessage(message: string): void {
    console.error('Error:', message);
    alert(message); // Temporary solution
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
