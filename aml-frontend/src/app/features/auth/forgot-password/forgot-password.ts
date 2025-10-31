import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './forgot-password.html',
  styleUrls: ['../login/login-new.css']
})
export class ForgotPassword {
  email: string = '';
  isLoading: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  onSubmit(): void {
    if (!this.email) {
      this.errorMessage = 'Please enter your email address';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.authService.forgotPassword({ email: this.email }).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.success) {
          this.successMessage = 'Password reset instructions have been sent to your email';
          // Navigate to reset password page after 2 seconds
          setTimeout(() => {
            this.router.navigate(['/auth/reset-password'], {
              queryParams: { email: this.email }
            });
          }, 2000);
        } else {
          this.errorMessage = response.message || 'Failed to send reset instructions';
        }
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Forgot password error:', error);
        this.errorMessage = error.error?.message || 'Failed to send reset instructions. Please try again.';
      }
    });
  }
}
