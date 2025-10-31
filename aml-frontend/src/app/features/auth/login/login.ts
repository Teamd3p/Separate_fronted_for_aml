import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { AuthService } from '../../../core/services/auth.service';
import { LoginRequest } from '../../../core/models/auth.models';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class Login {
  showPassword: boolean = false;
  rememberMe: boolean = false;
  isLoading: boolean = false;
  errorMessage: string = '';
  
  // Math CAPTCHA
  captchaNum1: number = 0;
  captchaNum2: number = 0;
  captchaAnswer: string = '';
  captchaCorrect: number = 0;
  
  loginData: LoginRequest = {
    email: '',
    password: ''
  };

  constructor(
    private authService: AuthService,
    private router: Router
  ) {
    this.generateCaptcha();
  }

  generateCaptcha(): void {
    this.captchaNum1 = Math.floor(Math.random() * 10) + 1;
    this.captchaNum2 = Math.floor(Math.random() * 10) + 1;
    this.captchaCorrect = this.captchaNum1 + this.captchaNum2;
    this.captchaAnswer = '';
  }

  validateCaptcha(): boolean {
    return parseInt(this.captchaAnswer) === this.captchaCorrect;
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  onLogin(): void {
    if (!this.validateCaptcha()) {
      this.errorMessage = 'Please solve the math problem correctly';
      this.generateCaptcha(); // Generate new captcha
      this.scrollToTop();
      return;
    }

    if (!this.loginData.email || !this.loginData.password) {
      this.errorMessage = 'Please fill in all required fields';
      this.scrollToTop();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.authService.login(this.loginData).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.success) {
          // Check if user needs OTP verification
          if (response.message?.includes('OTP') || response.message?.includes('verification')) {
            // Navigate to OTP verification page
            this.router.navigate(['/auth/verify-otp'], { 
              queryParams: { email: this.loginData.email } 
            });
          } else {
            // Direct login success, extract role from JWT token
            console.log('Login successful, extracting role from token...');
            const role = this.authService.getUserRoleFromToken();
            console.log('Extracted role:', role);
            
            if (role) {
              localStorage.setItem('role', role);
              console.log('Navigating based on role:', role);
              this.navigateBasedOnRole(role);
            } else {
              // Fallback to customer if role not found
              console.log('No role found in token, defaulting to CUSTOMER');
              this.navigateBasedOnRole('CUSTOMER');
            }
          }
        } else {
          this.errorMessage = response.message || 'Login failed';
          this.scrollToTop();
        }
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Login error:', error);
        this.errorMessage = 'Invalid email or password. Please try again.';
        this.scrollToTop();
      }
    });
  }

  private scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  private navigateBasedOnRole(role: string): void {
    // Normalize role to uppercase for comparison
    const normalizedRole = role.toUpperCase();
    console.log('navigateBasedOnRole called with role:', role, 'normalized:', normalizedRole);
    
    switch (normalizedRole) {
      case 'ADMIN':
        console.log('Redirecting to admin dashboard...');
        this.router.navigate(['/admin/dashboard']).then(success => {
          console.log('Navigation to admin dashboard:', success ? 'SUCCESS' : 'FAILED');
        });
        break;
      case 'COMPLIANCE_OFFICER':
      case 'OFFICER':
        console.log('Redirecting to compliance dashboard...');
        this.router.navigate(['/compliance/dashboard']).then(success => {
          console.log('Navigation to compliance dashboard:', success ? 'SUCCESS' : 'FAILED');
        });
        break;
      case 'CUSTOMER':
      case 'USER':
        console.log('Redirecting to customer dashboard...');
        this.router.navigate(['/dashboard']).then(success => {
          console.log('Navigation to customer dashboard:', success ? 'SUCCESS' : 'FAILED');
        });
        break;
      default:
        console.warn('Unknown role:', role, '- redirecting to customer dashboard');
        this.router.navigate(['/dashboard']);
        break;
    }
  }
}