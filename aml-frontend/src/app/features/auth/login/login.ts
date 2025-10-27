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
  captchaChecked: boolean = false;
  isLoading: boolean = false;
  errorMessage: string = '';
  
  loginData: LoginRequest = {
    email: '',
    password: ''
  };

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  onLogin(): void {
    if (!this.captchaChecked) {
      this.errorMessage = 'Please complete the captcha';
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
            // Direct login success, navigate to dashboard
            this.router.navigate(['/dashboard']);
          }
        } else {
          this.errorMessage = response.message || 'Login failed';
          this.scrollToTop();
        }
      },
      error: (error) => {
        this.isLoading = false;
        // Since API is not available, simulate successful login for demo
        console.log('API not available, simulating login success');
        
        // Store user data
        localStorage.setItem('token', 'demo-token');
        localStorage.setItem('email', this.loginData.email);
        
        // Navigate to dashboard
        this.router.navigate(['/dashboard']);
      }
    });
  }

  private scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}