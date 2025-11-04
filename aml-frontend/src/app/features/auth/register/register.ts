import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidatorFn, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { RegisterRequest } from '../../../core/models/auth.models';
import { CountryService } from '../../../core/services/country.service';
import { Country } from '../../../core/models/country.models';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterModule],
  templateUrl: './register.html',
  styleUrls: ['../login/login.css']
})
export class RegisterComponent implements OnInit {
  registrationForm!: FormGroup;
  isLoading: boolean = false;
  errorMessage: string = '';
  currentStep: number = 1;
  totalSteps: number = 3;
  showPassword: boolean = false;
  
  // For OTP verification
  otp: string = '';
  otpSent: boolean = false;

  // Country dropdown
  countries: Country[] = [];
  filteredCountries: Country[] = [];
  countrySearchTerm: string = '';
  showCountryDropdown: boolean = false;
  selectedCountry: Country | null = null;

  registerData: RegisterRequest = {
    email: '',
    password: '',
    firstName: '',
    middleName: '',
    lastName: '',
    dateOfBirth: '',
    nationality: '',
    contactNumber: '',
    street: '',
    city: '',
    state: '',
    country: '',
    pincode: ''
  };

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private countryService: CountryService
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.loadCountries();
  }

  loadCountries(): void {
    // Hardcoded list of all 195 countries
    this.countries = [
      { code: 'AF', name: 'Afghanistan', riskLevel: 'HIGH' },
      { code: 'AL', name: 'Albania', riskLevel: 'MEDIUM' },
      { code: 'DZ', name: 'Algeria', riskLevel: 'MEDIUM' },
      { code: 'AD', name: 'Andorra', riskLevel: 'LOW' },
      { code: 'AO', name: 'Angola', riskLevel: 'HIGH' },
      { code: 'AG', name: 'Antigua and Barbuda', riskLevel: 'MEDIUM' },
      { code: 'AR', name: 'Argentina', riskLevel: 'MEDIUM' },
      { code: 'AM', name: 'Armenia', riskLevel: 'MEDIUM' },
      { code: 'AU', name: 'Australia', riskLevel: 'LOW' },
      { code: 'AT', name: 'Austria', riskLevel: 'LOW' },
      { code: 'AZ', name: 'Azerbaijan', riskLevel: 'MEDIUM' },
      { code: 'BS', name: 'Bahamas', riskLevel: 'MEDIUM' },
      { code: 'BH', name: 'Bahrain', riskLevel: 'MEDIUM' },
      { code: 'BD', name: 'Bangladesh', riskLevel: 'MEDIUM' },
      { code: 'BB', name: 'Barbados', riskLevel: 'LOW' },
      { code: 'BY', name: 'Belarus', riskLevel: 'HIGH' },
      { code: 'BE', name: 'Belgium', riskLevel: 'LOW' },
      { code: 'BZ', name: 'Belize', riskLevel: 'MEDIUM' },
      { code: 'BJ', name: 'Benin', riskLevel: 'MEDIUM' },
      { code: 'BT', name: 'Bhutan', riskLevel: 'LOW' },
      { code: 'BO', name: 'Bolivia', riskLevel: 'MEDIUM' },
      { code: 'BA', name: 'Bosnia and Herzegovina', riskLevel: 'MEDIUM' },
      { code: 'BW', name: 'Botswana', riskLevel: 'LOW' },
      { code: 'BR', name: 'Brazil', riskLevel: 'MEDIUM' },
      { code: 'BN', name: 'Brunei', riskLevel: 'LOW' },
      { code: 'BG', name: 'Bulgaria', riskLevel: 'MEDIUM' },
      { code: 'BF', name: 'Burkina Faso', riskLevel: 'HIGH' },
      { code: 'BI', name: 'Burundi', riskLevel: 'HIGH' },
      { code: 'CV', name: 'Cabo Verde', riskLevel: 'MEDIUM' },
      { code: 'KH', name: 'Cambodia', riskLevel: 'MEDIUM' },
      { code: 'CM', name: 'Cameroon', riskLevel: 'MEDIUM' },
      { code: 'CA', name: 'Canada', riskLevel: 'LOW' },
      { code: 'CF', name: 'Central African Republic', riskLevel: 'HIGH' },
      { code: 'TD', name: 'Chad', riskLevel: 'HIGH' },
      { code: 'CL', name: 'Chile', riskLevel: 'LOW' },
      { code: 'CN', name: 'China', riskLevel: 'MEDIUM' },
      { code: 'CO', name: 'Colombia', riskLevel: 'MEDIUM' },
      { code: 'KM', name: 'Comoros', riskLevel: 'MEDIUM' },
      { code: 'CG', name: 'Congo', riskLevel: 'HIGH' },
      { code: 'CR', name: 'Costa Rica', riskLevel: 'LOW' },
      { code: 'HR', name: 'Croatia', riskLevel: 'LOW' },
      { code: 'CU', name: 'Cuba', riskLevel: 'HIGH' },
      { code: 'CY', name: 'Cyprus', riskLevel: 'LOW' },
      { code: 'CZ', name: 'Czech Republic', riskLevel: 'LOW' },
      { code: 'DK', name: 'Denmark', riskLevel: 'LOW' },
      { code: 'DJ', name: 'Djibouti', riskLevel: 'MEDIUM' },
      { code: 'DM', name: 'Dominica', riskLevel: 'MEDIUM' },
      { code: 'DO', name: 'Dominican Republic', riskLevel: 'MEDIUM' },
      { code: 'EC', name: 'Ecuador', riskLevel: 'MEDIUM' },
      { code: 'EG', name: 'Egypt', riskLevel: 'MEDIUM' },
      { code: 'SV', name: 'El Salvador', riskLevel: 'MEDIUM' },
      { code: 'GQ', name: 'Equatorial Guinea', riskLevel: 'HIGH' },
      { code: 'ER', name: 'Eritrea', riskLevel: 'HIGH' },
      { code: 'EE', name: 'Estonia', riskLevel: 'LOW' },
      { code: 'SZ', name: 'Eswatini', riskLevel: 'MEDIUM' },
      { code: 'ET', name: 'Ethiopia', riskLevel: 'MEDIUM' },
      { code: 'FJ', name: 'Fiji', riskLevel: 'MEDIUM' },
      { code: 'FI', name: 'Finland', riskLevel: 'LOW' },
      { code: 'FR', name: 'France', riskLevel: 'LOW' },
      { code: 'GA', name: 'Gabon', riskLevel: 'MEDIUM' },
      { code: 'GM', name: 'Gambia', riskLevel: 'MEDIUM' },
      { code: 'GE', name: 'Georgia', riskLevel: 'MEDIUM' },
      { code: 'DE', name: 'Germany', riskLevel: 'LOW' },
      { code: 'GH', name: 'Ghana', riskLevel: 'MEDIUM' },
      { code: 'GR', name: 'Greece', riskLevel: 'LOW' },
      { code: 'GD', name: 'Grenada', riskLevel: 'MEDIUM' },
      { code: 'GT', name: 'Guatemala', riskLevel: 'MEDIUM' },
      { code: 'GN', name: 'Guinea', riskLevel: 'HIGH' },
      { code: 'GW', name: 'Guinea-Bissau', riskLevel: 'HIGH' },
      { code: 'GY', name: 'Guyana', riskLevel: 'MEDIUM' },
      { code: 'HT', name: 'Haiti', riskLevel: 'HIGH' },
      { code: 'HN', name: 'Honduras', riskLevel: 'MEDIUM' },
      { code: 'HU', name: 'Hungary', riskLevel: 'LOW' },
      { code: 'IS', name: 'Iceland', riskLevel: 'LOW' },
      { code: 'IN', name: 'India', riskLevel: 'MEDIUM' },
      { code: 'ID', name: 'Indonesia', riskLevel: 'MEDIUM' },
      { code: 'IR', name: 'Iran', riskLevel: 'HIGH' },
      { code: 'IQ', name: 'Iraq', riskLevel: 'HIGH' },
      { code: 'IE', name: 'Ireland', riskLevel: 'LOW' },
      { code: 'IL', name: 'Israel', riskLevel: 'MEDIUM' },
      { code: 'IT', name: 'Italy', riskLevel: 'LOW' },
      { code: 'JM', name: 'Jamaica', riskLevel: 'MEDIUM' },
      { code: 'JP', name: 'Japan', riskLevel: 'LOW' },
      { code: 'JO', name: 'Jordan', riskLevel: 'MEDIUM' },
      { code: 'KZ', name: 'Kazakhstan', riskLevel: 'MEDIUM' },
      { code: 'KE', name: 'Kenya', riskLevel: 'MEDIUM' },
      { code: 'KI', name: 'Kiribati', riskLevel: 'MEDIUM' },
      { code: 'KP', name: 'North Korea', riskLevel: 'HIGH' },
      { code: 'KR', name: 'South Korea', riskLevel: 'LOW' },
      { code: 'KW', name: 'Kuwait', riskLevel: 'MEDIUM' },
      { code: 'KG', name: 'Kyrgyzstan', riskLevel: 'MEDIUM' },
      { code: 'LA', name: 'Laos', riskLevel: 'MEDIUM' },
      { code: 'LV', name: 'Latvia', riskLevel: 'LOW' },
      { code: 'LB', name: 'Lebanon', riskLevel: 'HIGH' },
      { code: 'LS', name: 'Lesotho', riskLevel: 'MEDIUM' },
      { code: 'LR', name: 'Liberia', riskLevel: 'MEDIUM' },
      { code: 'LY', name: 'Libya', riskLevel: 'HIGH' },
      { code: 'LI', name: 'Liechtenstein', riskLevel: 'LOW' },
      { code: 'LT', name: 'Lithuania', riskLevel: 'LOW' },
      { code: 'LU', name: 'Luxembourg', riskLevel: 'LOW' },
      { code: 'MG', name: 'Madagascar', riskLevel: 'MEDIUM' },
      { code: 'MW', name: 'Malawi', riskLevel: 'MEDIUM' },
      { code: 'MY', name: 'Malaysia', riskLevel: 'MEDIUM' },
      { code: 'MV', name: 'Maldives', riskLevel: 'MEDIUM' },
      { code: 'ML', name: 'Mali', riskLevel: 'HIGH' },
      { code: 'MT', name: 'Malta', riskLevel: 'LOW' },
      { code: 'MH', name: 'Marshall Islands', riskLevel: 'MEDIUM' },
      { code: 'MR', name: 'Mauritania', riskLevel: 'MEDIUM' },
      { code: 'MU', name: 'Mauritius', riskLevel: 'LOW' },
      { code: 'MX', name: 'Mexico', riskLevel: 'MEDIUM' },
      { code: 'FM', name: 'Micronesia', riskLevel: 'MEDIUM' },
      { code: 'MD', name: 'Moldova', riskLevel: 'MEDIUM' },
      { code: 'MC', name: 'Monaco', riskLevel: 'LOW' },
      { code: 'MN', name: 'Mongolia', riskLevel: 'MEDIUM' },
      { code: 'ME', name: 'Montenegro', riskLevel: 'MEDIUM' },
      { code: 'MA', name: 'Morocco', riskLevel: 'MEDIUM' },
      { code: 'MZ', name: 'Mozambique', riskLevel: 'MEDIUM' },
      { code: 'MM', name: 'Myanmar', riskLevel: 'HIGH' },
      { code: 'NA', name: 'Namibia', riskLevel: 'MEDIUM' },
      { code: 'NR', name: 'Nauru', riskLevel: 'MEDIUM' },
      { code: 'NP', name: 'Nepal', riskLevel: 'MEDIUM' },
      { code: 'NL', name: 'Netherlands', riskLevel: 'LOW' },
      { code: 'NZ', name: 'New Zealand', riskLevel: 'LOW' },
      { code: 'NI', name: 'Nicaragua', riskLevel: 'MEDIUM' },
      { code: 'NE', name: 'Niger', riskLevel: 'HIGH' },
      { code: 'NG', name: 'Nigeria', riskLevel: 'MEDIUM' },
      { code: 'MK', name: 'North Macedonia', riskLevel: 'MEDIUM' },
      { code: 'NO', name: 'Norway', riskLevel: 'LOW' },
      { code: 'OM', name: 'Oman', riskLevel: 'MEDIUM' },
      { code: 'PK', name: 'Pakistan', riskLevel: 'HIGH' },
      { code: 'PW', name: 'Palau', riskLevel: 'MEDIUM' },
      { code: 'PA', name: 'Panama', riskLevel: 'MEDIUM' },
      { code: 'PG', name: 'Papua New Guinea', riskLevel: 'MEDIUM' },
      { code: 'PY', name: 'Paraguay', riskLevel: 'MEDIUM' },
      { code: 'PE', name: 'Peru', riskLevel: 'MEDIUM' },
      { code: 'PH', name: 'Philippines', riskLevel: 'MEDIUM' },
      { code: 'PL', name: 'Poland', riskLevel: 'LOW' },
      { code: 'PT', name: 'Portugal', riskLevel: 'LOW' },
      { code: 'QA', name: 'Qatar', riskLevel: 'MEDIUM' },
      { code: 'RO', name: 'Romania', riskLevel: 'MEDIUM' },
      { code: 'RU', name: 'Russia', riskLevel: 'HIGH' },
      { code: 'RW', name: 'Rwanda', riskLevel: 'MEDIUM' },
      { code: 'KN', name: 'Saint Kitts and Nevis', riskLevel: 'MEDIUM' },
      { code: 'LC', name: 'Saint Lucia', riskLevel: 'MEDIUM' },
      { code: 'VC', name: 'Saint Vincent and the Grenadines', riskLevel: 'MEDIUM' },
      { code: 'WS', name: 'Samoa', riskLevel: 'MEDIUM' },
      { code: 'SM', name: 'San Marino', riskLevel: 'LOW' },
      { code: 'ST', name: 'Sao Tome and Principe', riskLevel: 'MEDIUM' },
      { code: 'SA', name: 'Saudi Arabia', riskLevel: 'MEDIUM' },
      { code: 'SN', name: 'Senegal', riskLevel: 'MEDIUM' },
      { code: 'RS', name: 'Serbia', riskLevel: 'MEDIUM' },
      { code: 'SC', name: 'Seychelles', riskLevel: 'MEDIUM' },
      { code: 'SL', name: 'Sierra Leone', riskLevel: 'MEDIUM' },
      { code: 'SG', name: 'Singapore', riskLevel: 'LOW' },
      { code: 'SK', name: 'Slovakia', riskLevel: 'LOW' },
      { code: 'SI', name: 'Slovenia', riskLevel: 'LOW' },
      { code: 'SB', name: 'Solomon Islands', riskLevel: 'MEDIUM' },
      { code: 'SO', name: 'Somalia', riskLevel: 'HIGH' },
      { code: 'ZA', name: 'South Africa', riskLevel: 'MEDIUM' },
      { code: 'SS', name: 'South Sudan', riskLevel: 'HIGH' },
      { code: 'ES', name: 'Spain', riskLevel: 'LOW' },
      { code: 'LK', name: 'Sri Lanka', riskLevel: 'MEDIUM' },
      { code: 'SD', name: 'Sudan', riskLevel: 'HIGH' },
      { code: 'SR', name: 'Suriname', riskLevel: 'MEDIUM' },
      { code: 'SE', name: 'Sweden', riskLevel: 'LOW' },
      { code: 'CH', name: 'Switzerland', riskLevel: 'LOW' },
      { code: 'SY', name: 'Syria', riskLevel: 'HIGH' },
      { code: 'TW', name: 'Taiwan', riskLevel: 'LOW' },
      { code: 'TJ', name: 'Tajikistan', riskLevel: 'MEDIUM' },
      { code: 'TZ', name: 'Tanzania', riskLevel: 'MEDIUM' },
      { code: 'TH', name: 'Thailand', riskLevel: 'MEDIUM' },
      { code: 'TL', name: 'Timor-Leste', riskLevel: 'MEDIUM' },
      { code: 'TG', name: 'Togo', riskLevel: 'MEDIUM' },
      { code: 'TO', name: 'Tonga', riskLevel: 'MEDIUM' },
      { code: 'TT', name: 'Trinidad and Tobago', riskLevel: 'MEDIUM' },
      { code: 'TN', name: 'Tunisia', riskLevel: 'MEDIUM' },
      { code: 'TR', name: 'Turkey', riskLevel: 'MEDIUM' },
      { code: 'TM', name: 'Turkmenistan', riskLevel: 'HIGH' },
      { code: 'TV', name: 'Tuvalu', riskLevel: 'MEDIUM' },
      { code: 'UG', name: 'Uganda', riskLevel: 'MEDIUM' },
      { code: 'UA', name: 'Ukraine', riskLevel: 'HIGH' },
      { code: 'AE', name: 'United Arab Emirates', riskLevel: 'MEDIUM' },
      { code: 'GB', name: 'United Kingdom', riskLevel: 'LOW' },
      { code: 'US', name: 'United States', riskLevel: 'LOW' },
      { code: 'UY', name: 'Uruguay', riskLevel: 'LOW' },
      { code: 'UZ', name: 'Uzbekistan', riskLevel: 'MEDIUM' },
      { code: 'VU', name: 'Vanuatu', riskLevel: 'MEDIUM' },
      { code: 'VA', name: 'Vatican City', riskLevel: 'LOW' },
      { code: 'VE', name: 'Venezuela', riskLevel: 'HIGH' },
      { code: 'VN', name: 'Vietnam', riskLevel: 'MEDIUM' },
      { code: 'YE', name: 'Yemen', riskLevel: 'HIGH' },
      { code: 'ZM', name: 'Zambia', riskLevel: 'MEDIUM' },
      { code: 'ZW', name: 'Zimbabwe', riskLevel: 'MEDIUM' }
    ];
    this.filteredCountries = this.countries;
  }

  get progressPercentage(): number {
    const totalFields = 12; // email, firstName, lastName, dob, contact, password, street, city, state, pincode, country, nationality
    let completedFields = 0;

    // Personal details fields (6 fields)
    if (this.registrationForm.get('email')?.valid) completedFields++;
    if (this.registrationForm.get('firstName')?.valid) completedFields++;
    if (this.registrationForm.get('lastName')?.valid) completedFields++;
    if (this.registrationForm.get('dateOfBirth')?.valid) completedFields++;
    if (this.registrationForm.get('contactNumber')?.valid) completedFields++;
    if (this.registrationForm.get('password')?.valid) completedFields++;

    // Address details fields (6 fields)
    if (this.registrationForm.get('street')?.valid) completedFields++;
    if (this.registrationForm.get('city')?.valid) completedFields++;
    if (this.registrationForm.get('state')?.valid) completedFields++;
    if (this.registrationForm.get('pincode')?.valid) completedFields++;
    if (this.registrationForm.get('country')?.valid) completedFields++;
    if (this.registrationForm.get('nationality')?.valid) completedFields++;

    return Math.round((completedFields / totalFields) * 100);
  }

  get isPersonalDetailsValid(): boolean {
    return !!(this.registrationForm.get('email')?.valid &&
           this.registrationForm.get('firstName')?.valid &&
           this.registrationForm.get('lastName')?.valid &&
           this.registrationForm.get('dateOfBirth')?.valid &&
           this.registrationForm.get('contactNumber')?.valid &&
           this.registrationForm.get('password')?.valid);
  }

  get isAddressDetailsValid(): boolean {
    return !!(this.registrationForm.get('street')?.valid &&
           this.registrationForm.get('city')?.valid &&
           this.registrationForm.get('state')?.valid &&
           this.registrationForm.get('pincode')?.valid &&
           this.registrationForm.get('country')?.valid &&
           this.registrationForm.get('nationality')?.valid &&
           this.registrationForm.get('agreement')?.valid);
  }

  nextStep(): void {
    if (this.currentStep === 1 && this.isPersonalDetailsValid) {
      this.currentStep = 2;
    } else if (this.currentStep === 2 && this.isAddressDetailsValid) {
      // Submit registration when moving from step 2 to step 3
      this.submitRegistration();
    }
  }

  submitRegistration(): void {
    if (!this.registrationForm.valid) {
      this.errorMessage = 'Please fill in all required fields';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    // Map form data to RegisterRequest
    const formValue = this.registrationForm.value;
    this.registerData = {
      email: formValue.email,
      password: formValue.password,
      firstName: formValue.firstName,
      middleName: formValue.middleName || '',
      lastName: formValue.lastName,
      dateOfBirth: formValue.dateOfBirth,
      nationality: formValue.nationality,
      contactNumber: formValue.contactNumber,
      street: formValue.street || '',
      city: formValue.city,
      state: formValue.state,
      country: formValue.country,
      pincode: formValue.pincode
    };

    this.authService.register(this.registerData).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.success) {
          // OTP sent successfully, move to step 3
          this.otpSent = true;
          this.currentStep = 3;
        } else {
          this.errorMessage = response.message || 'Registration failed';
          this.scrollToTop();
        }
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Registration error:', error);
        
        // Handle different types of errors
        if (error.error) {
          // Check if it's a validation error with field-specific messages
          if (error.error.errors && Array.isArray(error.error.errors)) {
            // Spring Boot validation errors format
            const errorMessages = error.error.errors.map((err: any) => 
              `${err.field}: ${err.defaultMessage || err.message}`
            ).join(', ');
            this.errorMessage = errorMessages;
          } else if (error.error.message) {
            // Standard error message
            this.errorMessage = error.error.message;
          } else if (typeof error.error === 'string') {
            // Plain string error
            this.errorMessage = error.error;
          } else {
            // Generic error
            this.errorMessage = 'Registration failed. Please check your information and try again.';
          }
        } else if (error.message) {
          this.errorMessage = error.message;
        } else {
          this.errorMessage = 'An error occurred during registration';
        }
        
        this.scrollToTop();
      }
    });
  }

  sendOTP(): void {
    // Resend OTP
    this.submitRegistration();
  }

  previousStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  getTodayDate(): string {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private initializeForm(): void {
    this.registrationForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      middleName: [''],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      dateOfBirth: ['', [Validators.required]],
      nationality: ['', [Validators.required]],
      contactNumber: ['', [Validators.required, Validators.pattern('^[0-9]{10,15}$')]],
      password: ['', [
        Validators.required,
        Validators.minLength(8),
        this.passwordValidator()
      ]],
      street: ['', [Validators.required]],
      city: ['', [Validators.required]],
      state: ['', [Validators.required]],
      country: ['', [Validators.required]],
      pincode: ['', [Validators.required]],
      agreement: [false, [Validators.requiredTrue]]
    });
  }

  // Country search and selection
  onCountrySearch(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.countrySearchTerm = input.value;
    this.showCountryDropdown = true;
    
    if (this.countrySearchTerm) {
      this.filteredCountries = this.countries.filter(country =>
        country.name.toLowerCase().startsWith(this.countrySearchTerm.toLowerCase()) ||
        country.code.toLowerCase().startsWith(this.countrySearchTerm.toLowerCase())
      );
    } else {
      this.filteredCountries = this.countries;
    }
  }

  selectCountry(country: Country): void {
    console.log('Country selected:', country);
    this.selectedCountry = country;
    this.countrySearchTerm = country.name;
    this.showCountryDropdown = false;
    
    // Set country code (ISO 2-char) in form
    this.registrationForm.patchValue({
      country: country.code,
      nationality: country.name // Auto-populate nationality
    });
    
    console.log('Form values after selection:', {
      country: this.registrationForm.get('country')?.value,
      nationality: this.registrationForm.get('nationality')?.value
    });
  }

  onCountryInputBlur(): void {
    // Delay to allow mousedown on dropdown item
    setTimeout(() => {
      this.showCountryDropdown = false;
    }, 300);
  }

  onCountryInputFocus(): void {
    this.showCountryDropdown = true;
    if (!this.countrySearchTerm) {
      this.filteredCountries = this.countries;
    }
  }

  private passwordValidator(): ValidatorFn {
    return (control: AbstractControl): {[key: string]: any} | null => {
      const value = control.value;
      if (!value) return null;

      const hasNumber = /[0-9]/.test(value);
      const hasUpper = /[A-Z]/.test(value);
      const hasLower = /[a-z]/.test(value);
      const hasSpecial = /[@#$%^&+=]/.test(value);

      const valid = hasNumber && hasUpper && hasLower && hasSpecial;
      return valid ? null : { 'passwordStrength': true };
    };
  }

  onSubmit(): void {
    // This is called from step 3 - OTP verification
    if (!this.otp || this.otp.length !== 6) {
      this.errorMessage = 'Please enter a valid 6-digit verification code';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const verifyData = {
      email: this.registerData.email,
      otp: this.otp
    };

    this.authService.verifyOtp(verifyData).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.success) {
          // Navigate to login page after successful verification
          this.router.navigate(['/auth/login'], {
            queryParams: { verified: 'true' }
          });
        } else {
          this.errorMessage = response.message || 'OTP verification failed';
          this.scrollToTop();
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.error?.message || 'An error occurred during verification';
        console.error('OTP verification error:', error);
        this.scrollToTop();
      }
    });
  }

  private markFormGroupTouched(): void {
    Object.keys(this.registrationForm.controls).forEach(key => {
      const control = this.registrationForm.get(key);
      control?.markAsTouched();
    });
  }

  getFieldError(fieldName: string): string {
    const field = this.registrationForm.get(fieldName);
    if (field?.touched && field?.errors) {
      if (field.errors['required']) return `${fieldName} is required`;
      if (field.errors['email']) return 'Invalid email format';
      if (field.errors['minlength']) return `${fieldName} is too short`;
      if (field.errors['pattern']) return `Invalid ${fieldName} format`;
      if (field.errors['passwordStrength']) return 'Password must contain uppercase, lowercase, number, and special character';
    }
    return '';
  }

  private scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}