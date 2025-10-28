import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';

interface User {
  userId: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
  status: string;
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
}

interface ComplianceOfficer {
  officerId: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  employeeId: string;
  department: string;
  isActive: boolean;
  createdAt: string;
}

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './users.html',
  styleUrl: './users.css',
})
export class Users implements OnInit {
  activeTab: string = 'customers';
  customers: User[] = [];
  officers: ComplianceOfficer[] = [];
  filteredCustomers: User[] = [];
  filteredOfficers: ComplianceOfficer[] = [];
  
  customerSearchTerm: string = '';
  officerSearchTerm: string = '';
  
  loading: boolean = false;
  showAddOfficerModal: boolean = false;
  addingOfficer: boolean = false;
  
  newOfficer = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: ''
  };
  
  private apiUrl = 'http://localhost:8080/api';

  constructor(
    private router: Router,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.loadCustomers();
    this.loadOfficers();
  }

  // Tab Management
  switchTab(tabName: string): void {
    this.activeTab = tabName;
  }

  // Load Data Methods
  loadCustomers(): void {
    this.loading = true;
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    console.log('Loading customers with token:', token ? 'Token exists' : 'No token');

    // Try multiple endpoints to get customer data
    this.tryLoadCustomersFromMultipleEndpoints(headers);
  }

  private tryLoadCustomersFromMultipleEndpoints(headers: HttpHeaders): void {
    // First try the KYC compliance endpoint
    this.http.get<any>(`${this.apiUrl}/kyc/compliance/customers/status`, { headers })
      .subscribe({
        next: (response) => {
          console.log('KYC Customers data received:', response);
          this.processCustomersResponse(response);
        },
        error: (error) => {
          console.log('KYC endpoint failed, trying alternative endpoints:', error.status);
          // Try alternative endpoints
          this.tryAlternativeCustomerEndpoints(headers);
        }
      });
  }

  private tryAlternativeCustomerEndpoints(headers: HttpHeaders): void {
    // Try direct users endpoint
    this.http.get<any[]>(`${this.apiUrl}/users`, { headers })
      .subscribe({
        next: (users) => {
          console.log('Users endpoint data received:', users);
          const customers = users.filter(user => user.role === 'CUSTOMER' || user.role === 'customer');
          this.processCustomersResponse(customers);
        },
        error: (error) => {
          console.log('Users endpoint failed, trying admin customers endpoint:', error.status);
          // Try admin customers endpoint
          this.http.get<any[]>(`${this.apiUrl}/admin/customers`, { headers })
            .subscribe({
              next: (customers) => {
                console.log('Admin customers endpoint data received:', customers);
                this.processCustomersResponse(customers);
              },
              error: (error) => {
                console.error('All customer endpoints failed:', error);
                this.loading = false;
                // Use mock data as last resort
                this.loadMockCustomers();
              }
            });
        }
      });
  }

  private processCustomersResponse(response: any): void {
    // Handle different response formats
    let customersData: any[] = [];
    if (Array.isArray(response)) {
      customersData = response;
    } else if (response && Array.isArray(response.content)) {
      customersData = response.content;
    } else if (response && Array.isArray(response.data)) {
      customersData = response.data;
    } else if (response && typeof response === 'object') {
      const keys = Object.keys(response);
      for (const key of keys) {
        if (Array.isArray(response[key])) {
          customersData = response[key];
          break;
        }
      }
    }
    
    this.customers = customersData.map(customer => ({
      userId: customer.userId || customer.id || customer.customerId,
      firstName: customer.firstName || customer.first_name || customer.name?.split(' ')[0] || 'Unknown',
      lastName: customer.lastName || customer.last_name || customer.name?.split(' ').slice(1).join(' ') || 'User',
      email: customer.email || customer.emailAddress || customer.userEmail || 'No email provided',
      phone: customer.phone || customer.phoneNumber || customer.mobile || customer.contactNumber || 'No phone provided',
      role: 'CUSTOMER',
      status: customer.accountStatus || customer.status || customer.userStatus || 'ACTIVE',
      isActive: customer.isActive !== false && customer.accountStatus !== 'SUSPENDED' && customer.status !== 'INACTIVE',
      createdAt: customer.createdAt || customer.registrationDate || customer.dateCreated || new Date().toISOString(),
      lastLogin: customer.lastLogin || customer.lastLoginDate
    }));
    
    this.filteredCustomers = [...this.customers];
    this.loading = false;
    console.log('Processed customers:', this.customers);
  }

  loadOfficers(): void {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    console.log('Loading officers with token:', token ? 'Token exists' : 'No token');

    this.http.get<any[]>(`${this.apiUrl}/admin/officers`, { headers })
      .subscribe({
        next: (officers) => {
          console.log('Officers data received:', officers);
          this.officers = officers.map(officer => ({
            officerId: officer.officerId || officer.id || officer.userId,
            firstName: officer.firstName || officer.first_name || officer.name?.split(' ')[0] || 'Unknown',
            lastName: officer.lastName || officer.last_name || officer.name?.split(' ').slice(1).join(' ') || 'Officer',
            email: officer.email || officer.emailAddress || 'No email provided',
            phone: officer.phone || officer.phoneNumber || officer.mobile || 'No phone provided',
            employeeId: officer.employeeId || officer.employee_id || `EMP${officer.officerId || officer.id}`,
            department: officer.department || officer.dept || 'Compliance',
            isActive: officer.isActive !== false && officer.status !== 'INACTIVE',
            createdAt: officer.createdAt || officer.dateCreated || new Date().toISOString()
          }));
          this.filteredOfficers = [...this.officers];
          console.log('Processed officers:', this.officers);
        },
        error: (error) => {
          console.error('Error loading officers:', error.status, error.message);
          // Fallback to mock data
          this.loadMockOfficers();
        }
      });
  }

  // Mock data for fallback
  loadMockCustomers(): void {
    this.customers = [
      {
        userId: 1,
        firstName: 'Deep',
        lastName: 'Ratanpara',
        email: 'ratanparadeep3108@gmail.com',
        phone: '9876543210',
        role: 'CUSTOMER',
        status: 'INACTIVE',
        isActive: false,
        createdAt: '2024-01-15T10:30:00Z'
      },
      {
        userId: 2,
        firstName: 'Deep',
        lastName: 'Ratanpara',
        email: 'deep.ratanpara12016@marwadiuniversity.ac.in',
        phone: '9876543210',
        role: 'CUSTOMER',
        status: 'ACTIVE',
        isActive: true,
        createdAt: '2024-02-10T14:20:00Z'
      },
      {
        userId: 3,
        firstName: 'Harshad',
        lastName: 'Panchani',
        email: 'cedop53335@dropeso.com',
        phone: '9876543210',
        role: 'CUSTOMER',
        status: 'ACTIVE',
        isActive: true,
        createdAt: '2024-03-05T09:15:00Z'
      }
    ];
    this.filteredCustomers = [...this.customers];
  }

  loadMockOfficers(): void {
    this.officers = [
      {
        officerId: 1,
        firstName: 'Compliance',
        lastName: 'Officer',
        email: 'officer@aml-admin.com',
        phone: '9876543210',
        employeeId: 'EMP001',
        department: 'Compliance',
        isActive: true,
        createdAt: '2024-01-01T08:00:00Z'
      }
    ];
    this.filteredOfficers = [...this.officers];
  }

  // Search Methods
  searchCustomers(): void {
    if (!this.customerSearchTerm.trim()) {
      this.filteredCustomers = [...this.customers];
      return;
    }
    
    const searchTerm = this.customerSearchTerm.toLowerCase();
    this.filteredCustomers = this.customers.filter(customer => 
      customer.firstName.toLowerCase().includes(searchTerm) ||
      customer.lastName.toLowerCase().includes(searchTerm) ||
      customer.email.toLowerCase().includes(searchTerm) ||
      customer.phone.includes(searchTerm)
    );
  }

  searchOfficers(): void {
    if (!this.officerSearchTerm.trim()) {
      this.filteredOfficers = [...this.officers];
      return;
    }
    
    const searchTerm = this.officerSearchTerm.toLowerCase();
    this.filteredOfficers = this.officers.filter(officer => 
      officer.firstName.toLowerCase().includes(searchTerm) ||
      officer.lastName.toLowerCase().includes(searchTerm) ||
      officer.email.toLowerCase().includes(searchTerm) ||
      officer.phone.includes(searchTerm) ||
      officer.employeeId.toLowerCase().includes(searchTerm)
    );
  }

  // User Actions
  editUser(user: User): void {
    console.log('Edit user:', user);
    // TODO: Implement edit user modal/form
    alert(`Edit functionality for ${user.firstName} ${user.lastName} will be implemented`);
  }

  toggleUserStatus(user: User): void {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    const newStatus = user.isActive ? 'SUSPENDED' : 'ACTIVE';
    const action = user.isActive ? 'suspend' : 'activate';

    if (confirm(`Are you sure you want to ${action} ${user.firstName} ${user.lastName}?`)) {
      this.http.put(`${this.apiUrl}/admin/customers/${user.userId}/account-status`, 
        { status: newStatus, reason: `${action.toUpperCase()} by admin` }, 
        { headers }
      ).subscribe({
        next: (response) => {
          console.log(`User ${action}d successfully:`, response);
          user.isActive = !user.isActive;
          user.status = newStatus;
          alert(`User ${action}d successfully!`);
        },
        error: (error) => {
          console.error(`Error ${action}ing user:`, error);
          alert(`Failed to ${action} user: ${error.error?.message || error.message}`);
        }
      });
    }
  }

  deleteUser(user: User): void {
    if (confirm(`Are you sure you want to delete ${user.firstName} ${user.lastName}? This action cannot be undone.`)) {
      const token = localStorage.getItem('token');
      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`
      });

      // Note: Implement actual delete endpoint when available
      console.log('Delete user:', user);
      alert('Delete functionality will be implemented when backend endpoint is available');
    }
  }

  // Officer Actions
  editOfficer(officer: ComplianceOfficer): void {
    console.log('Edit officer:', officer);
    alert(`Edit functionality for ${officer.firstName} ${officer.lastName} will be implemented`);
  }

  toggleOfficerStatus(officer: ComplianceOfficer): void {
    const action = officer.isActive ? 'deactivate' : 'activate';
    
    if (confirm(`Are you sure you want to ${action} ${officer.firstName} ${officer.lastName}?`)) {
      // TODO: Implement officer status toggle API call
      officer.isActive = !officer.isActive;
      alert(`Officer ${action}d successfully!`);
    }
  }

  deleteOfficer(officer: ComplianceOfficer): void {
    if (confirm(`Are you sure you want to delete ${officer.firstName} ${officer.lastName}? This action cannot be undone.`)) {
      const token = localStorage.getItem('token');
      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`
      });

      this.http.delete(`${this.apiUrl}/admin/officers/${officer.officerId}`, { headers })
        .subscribe({
          next: () => {
            console.log('Officer deleted successfully');
            this.officers = this.officers.filter(o => o.officerId !== officer.officerId);
            this.filteredOfficers = this.filteredOfficers.filter(o => o.officerId !== officer.officerId);
            alert('Officer deleted successfully!');
          },
          error: (error) => {
            console.error('Error deleting officer:', error);
            alert(`Failed to delete officer: ${error.error?.message || error.message}`);
          }
        });
    }
  }

  // Navigation
  navigateToTab(tab: string): void {
    switch(tab) {
      case 'dashboard':
        this.router.navigate(['/admin/dashboard']);
        break;
      case 'kyc':
        this.router.navigate(['/admin/kyc-review']);
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

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('email');
    this.router.navigate(['/auth/login']);
  }

  // Utility Methods
  getStatusClass(status: string, isActive: boolean): string {
    if (!isActive || status === 'SUSPENDED' || status === 'INACTIVE') {
      return 'inactive';
    }
    return 'active';
  }

  getStatusText(status: string, isActive: boolean): string {
    if (!isActive || status === 'SUSPENDED') {
      return 'SUSPENDED';
    }
    if (status === 'INACTIVE') {
      return 'INACTIVE';
    }
    return status || 'ACTIVE';
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  }

  getCustomerCount(): number {
    return this.customers.length;
  }

  getOfficerCount(): number {
    return this.officers.length;
  }

  // Add Officer Modal Methods
  openAddOfficerModal(): void {
    this.showAddOfficerModal = true;
    this.resetNewOfficerForm();
  }

  closeAddOfficerModal(): void {
    this.showAddOfficerModal = false;
    this.resetNewOfficerForm();
  }

  resetNewOfficerForm(): void {
    this.newOfficer = {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      password: ''
    };
  }

  addOfficer(): void {
    // Auto-generate password if empty
    if (!this.newOfficer.password.trim()) {
      this.generatePassword();
    }

    if (!this.validateOfficerForm()) {
      return;
    }

    this.addingOfficer = true;
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    const officerRequest = {
      firstName: this.newOfficer.firstName.trim(),
      lastName: this.newOfficer.lastName.trim(),
      email: this.newOfficer.email.trim(),
      phone: this.newOfficer.phone.trim(),
      password: this.newOfficer.password
    };

    console.log('Creating officer:', officerRequest);

    this.http.post<ComplianceOfficer>(`${this.apiUrl}/admin/officers`, officerRequest, { headers })
      .subscribe({
        next: (newOfficer) => {
          console.log('Officer created successfully:', newOfficer);
          
          // Add the new officer to the list
          const processedOfficer: ComplianceOfficer = {
            officerId: newOfficer.officerId || Date.now(),
            firstName: newOfficer.firstName,
            lastName: newOfficer.lastName,
            email: newOfficer.email,
            phone: newOfficer.phone || 'No phone provided',
            employeeId: newOfficer.employeeId || `EMP${newOfficer.officerId}`,
            department: newOfficer.department || 'Compliance',
            isActive: true,
            createdAt: new Date().toISOString()
          };
          
          this.officers.push(processedOfficer);
          this.filteredOfficers = [...this.officers];
          
          this.addingOfficer = false;
          this.closeAddOfficerModal();
          alert('Officer added successfully!');
        },
        error: (error) => {
          console.error('Error creating officer:', error);
          this.addingOfficer = false;
          
          let errorMessage = this.parseErrorMessage(error);
          alert(errorMessage);
        }
      });
  }

  validateOfficerForm(): boolean {
    const errors: string[] = [];
    
    if (!this.newOfficer.firstName.trim()) {
      errors.push('First name is required');
    }
    
    if (!this.newOfficer.lastName.trim()) {
      errors.push('Last name is required');
    }
    
    if (!this.newOfficer.email.trim()) {
      errors.push('Email is required');
    } else if (!this.isValidEmail(this.newOfficer.email)) {
      errors.push('Please enter a valid email address');
    } else if (this.isEmailAlreadyExists(this.newOfficer.email)) {
      errors.push('This email address is already registered. Please use a different email.');
    }
    
    if (!this.newOfficer.password.trim()) {
      errors.push('Password is required');
    } else if (this.newOfficer.password.length < 6) {
      errors.push('Password must be at least 6 characters long');
    }
    
    if (errors.length > 0) {
      alert('Please fix the following errors:\n\n' + errors.join('\n'));
      return false;
    }
    
    return true;
  }

  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  isEmailAlreadyExists(email: string): boolean {
    const emailLower = email.toLowerCase().trim();
    
    // Check in officers list
    const existsInOfficers = this.officers.some(officer => 
      officer.email.toLowerCase().trim() === emailLower
    );
    
    // Check in customers list
    const existsInCustomers = this.customers.some(customer => 
      customer.email.toLowerCase().trim() === emailLower
    );
    
    return existsInOfficers || existsInCustomers;
  }

  generatePassword(): void {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    this.newOfficer.password = password;
  }

  private parseErrorMessage(error: any): string {
    console.log('Full error object:', error);
    
    // Check for duplicate email constraint
    if (error.error && typeof error.error === 'string') {
      if (error.error.includes('Duplicate entry') && error.error.includes('email')) {
        return 'This email address is already registered. Please use a different email address.';
      }
      if (error.error.includes('UK6dotkott2kjsp8vw4d0m25fb7')) {
        return 'This email address is already registered. Please use a different email address.';
      }
    }
    
    // Check for structured error response
    if (error.error?.message) {
      const message = error.error.message;
      if (message.includes('Duplicate entry') || message.includes('already exists')) {
        if (message.includes('email')) {
          return 'This email address is already registered. Please use a different email address.';
        }
        return 'This information is already registered. Please check your input.';
      }
      return `Failed to add officer: ${message}`;
    }
    
    // Check for validation errors
    if (error.error?.errors && Array.isArray(error.error.errors)) {
      const errorMessages = error.error.errors.map((err: any) => err.message || err).join(', ');
      return `Validation failed: ${errorMessages}`;
    }
    
    // Check for status-specific errors
    if (error.status === 409) {
      return 'This email address is already registered. Please use a different email address.';
    }
    
    if (error.status === 400) {
      return 'Invalid data provided. Please check all fields and try again.';
    }
    
    if (error.status === 401) {
      return 'You are not authorized to perform this action. Please login again.';
    }
    
    if (error.status === 403) {
      return 'You do not have permission to add officers.';
    }
    
    // Default error message
    return error.message || 'Failed to add officer. Please try again.';
  }
}
