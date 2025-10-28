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
  styleUrls: ['./register.css']
})
export class RegisterComponent implements OnInit {
  registrationForm!: FormGroup;
  isLoading: boolean = false;
  errorMessage: string = '';

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
    if (this.registrationForm.valid) {
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
            // Navigate to OTP verification page
            this.router.navigate(['/auth/verify-otp'], { 
              queryParams: { email: this.registerData.email } 
            });
          } else {
            this.errorMessage = response.message || 'Registration failed';
            // Scroll to top to show error message
            this.scrollToTop();
          }
        },
        error: (error) => {
          this.isLoading = false;
          this.errorMessage = error.error?.message || 'An error occurred during registration';
          console.error('Registration error:', error);
          // Scroll to top to show error message
          this.scrollToTop();
        }
      });
    } else {
      this.errorMessage = 'Please fill in all required fields and accept the terms';
      this.markFormGroupTouched();
      // Scroll to top to show error message
      this.scrollToTop();
    }
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