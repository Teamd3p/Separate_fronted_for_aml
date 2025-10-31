import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidatorFn, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { RegisterRequest } from '../../../core/models/auth.models';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterModule],
  templateUrl: './register.html',
  styleUrls: ['../login/login-new.css']
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
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initializeForm();
  }

  get progressPercentage(): number {
    const totalFields = 11; // email, firstName, lastName, dob, contact, password, city, state, pincode, country, nationality
    let completedFields = 0;

    // Personal details fields (6 fields)
    if (this.registrationForm.get('email')?.valid) completedFields++;
    if (this.registrationForm.get('firstName')?.valid) completedFields++;
    if (this.registrationForm.get('lastName')?.valid) completedFields++;
    if (this.registrationForm.get('dateOfBirth')?.valid) completedFields++;
    if (this.registrationForm.get('contactNumber')?.valid) completedFields++;
    if (this.registrationForm.get('password')?.valid) completedFields++;

    // Address details fields (5 fields)
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
    return !!(this.registrationForm.get('city')?.valid &&
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
      street: [''],
      city: ['', [Validators.required]],
      state: ['', [Validators.required]],
      country: ['', [Validators.required]],
      pincode: ['', [Validators.required]],
      agreement: [false, [Validators.requiredTrue]]
    });
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