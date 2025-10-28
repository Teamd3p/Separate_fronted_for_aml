import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CountryService } from '../../../core/services/country.service';
import { Country as CountryModel, CountryCreateRequest, CountryUpdateRequest } from '../../../core/models/country.models';

@Component({
  selector: 'app-country',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './country.html',
  styleUrl: './country.css',
})
export class Country implements OnInit {
  countries: CountryModel[] = [];
  filteredCountries: CountryModel[] = [];
  loading: boolean = false;
  searchTerm: string = '';
  
  // Statistics
  totalCountries: number = 0;
  activeCountries: number = 0;
  inactiveCountries: number = 0;
  
  // Modal states
  showAddModal: boolean = false;
  showEditModal: boolean = false;
  showDeleteModal: boolean = false;
  showViewModal: boolean = false;
  
  // Form data
  newCountry: CountryCreateRequest = {
    code: '',
    name: '',
    riskLevel: 'MEDIUM'
  };
  
  editCountry: CountryUpdateRequest = {};
  selectedCountry: CountryModel | null = null;
  
  // Form validation
  formErrors: any = {};
  isSubmitting: boolean = false;

  constructor(
    private countryService: CountryService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadCountries();
  }

  // Load countries from API
  loadCountries(): void {
    this.loading = true;
    this.countryService.getCountries().subscribe({
      next: (countries) => {
        this.countries = countries;
        this.filteredCountries = [...countries];
        this.updateStatistics();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading countries:', error);
        this.loading = false;
      }
    });
  }

  // Update statistics
  updateStatistics(): void {
    this.totalCountries = this.countries.length;
    this.activeCountries = this.countries.filter(c => c.isActive).length;
    this.inactiveCountries = this.countries.filter(c => !c.isActive).length;
  }

  // Search functionality
  onSearchChange(): void {
    if (!this.searchTerm.trim()) {
      this.filteredCountries = [...this.countries];
      return;
    }

    const searchLower = this.searchTerm.toLowerCase();
    this.filteredCountries = this.countries.filter(country =>
      country.name.toLowerCase().includes(searchLower) ||
      country.code.toLowerCase().includes(searchLower)
    );
  }

  // Modal management
  openAddModal(): void {
    this.newCountry = {
      code: '',
      name: '',
      riskLevel: 'MEDIUM'
    };
    this.formErrors = {};
    this.showAddModal = true;
  }

  openEditModal(country: CountryModel): void {
    this.selectedCountry = country;
    this.editCountry = {
      code: country.code,
      name: country.name,
      riskLevel: country.riskLevel as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
      isActive: country.isActive
    };
    this.formErrors = {};
    this.showEditModal = true;
  }

  openViewModal(country: CountryModel): void {
    this.selectedCountry = country;
    this.showViewModal = true;
  }

  openDeleteModal(country: CountryModel): void {
    this.selectedCountry = country;
    this.showDeleteModal = true;
  }

  closeModals(): void {
    this.showAddModal = false;
    this.showEditModal = false;
    this.showDeleteModal = false;
    this.showViewModal = false;
    this.selectedCountry = null;
    this.formErrors = {};
    this.isSubmitting = false;
  }

  // CRUD Operations
  createCountry(): void {
    if (!this.validateCountryForm(this.newCountry)) {
      return;
    }

    this.isSubmitting = true;
    this.countryService.createCountry(this.newCountry).subscribe({
      next: (country) => {
        this.countries.push(country);
        this.filteredCountries = [...this.countries];
        this.updateStatistics();
        this.closeModals();
        this.showSuccessMessage('Country created successfully');
      },
      error: (error) => {
        console.error('Error creating country:', error);
        this.isSubmitting = false;
        this.showErrorMessage('Failed to create country');
      }
    });
  }

  updateCountry(): void {
    if (!this.selectedCountry || !this.validateCountryForm(this.editCountry)) {
      return;
    }

    this.isSubmitting = true;
    this.countryService.updateCountry(this.selectedCountry.code, this.editCountry).subscribe({
      next: (updatedCountry) => {
        const index = this.countries.findIndex(c => c.code === updatedCountry.code);
        if (index !== -1) {
          this.countries[index] = updatedCountry;
          this.filteredCountries = [...this.countries];
        }
        this.updateStatistics();
        this.closeModals();
        this.showSuccessMessage('Country updated successfully');
      },
      error: (error) => {
        console.error('Error updating country:', error);
        this.isSubmitting = false;
        this.showErrorMessage('Failed to update country');
      }
    });
  }

  deleteCountry(): void {
    if (!this.selectedCountry) return;

    this.isSubmitting = true;
    this.countryService.deleteCountry(this.selectedCountry.code).subscribe({
      next: () => {
        this.countries = this.countries.filter(c => c.code !== this.selectedCountry!.code);
        this.filteredCountries = [...this.countries];
        this.updateStatistics();
        this.closeModals();
        this.showSuccessMessage('Country deleted successfully');
      },
      error: (error) => {
        console.error('Error deleting country:', error);
        this.isSubmitting = false;
        this.showErrorMessage('Failed to delete country');
      }
    });
  }

  toggleCountryStatus(country: CountryModel): void {
    
    const newStatus = !country.isActive;
    this.countryService.toggleCountryStatus(country.code, newStatus).subscribe({
      next: (updatedCountry) => {
        const index = this.countries.findIndex(c => c.code === updatedCountry.code);
        if (index !== -1) {
          this.countries[index] = updatedCountry;
          this.filteredCountries = [...this.countries];
        }
        this.updateStatistics();
        this.showSuccessMessage(`Country ${newStatus ? 'activated' : 'deactivated'} successfully`);
      },
      error: (error) => {
        console.error('Error updating country status:', error);
        this.showErrorMessage('Failed to update country status');
      }
    });
  }

  // Form validation
  validateCountryForm(country: any): boolean {
    this.formErrors = {};
    let isValid = true;

    if (!country.code || country.code.trim().length === 0) {
      this.formErrors.code = 'Country code is required';
      isValid = false;
    } else if (country.code.length !== 2) {
      this.formErrors.code = 'Country code must be 2 characters';
      isValid = false;
    }

    if (!country.name || country.name.trim().length === 0) {
      this.formErrors.name = 'Country name is required';
      isValid = false;
    }

    if (!country.riskLevel) {
      this.formErrors.riskLevel = 'Risk level is required';
      isValid = false;
    }

    return isValid;
  }

  // Utility methods
  getRiskBadgeClass(riskLevel: string): string {
    switch (riskLevel) {
      case 'CRITICAL': return 'risk-badge critical';
      case 'HIGH': return 'risk-badge high';
      case 'MEDIUM': return 'risk-badge medium';
      case 'LOW': return 'risk-badge low';
      default: return 'risk-badge medium';
    }
  }

  showSuccessMessage(message: string): void {
    // You can implement a toast notification service here
    console.log('Success:', message);
    alert(message); // Temporary solution
  }

  showErrorMessage(message: string): void {
    // You can implement a toast notification service here
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
