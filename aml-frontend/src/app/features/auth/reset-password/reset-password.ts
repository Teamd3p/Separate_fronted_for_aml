import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './reset-password.html',
  styleUrls: ['../login/login-new.css']
})
export class ResetPassword implements OnInit {
  email: string = '';
  otp: string = '';
  newPassword: string = '';
  confirmPassword: string = '';
  showPassword: boolean = false;
  showConfirmPassword: boolean = false;
  isLoading: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Get email from query params
    this.route.queryParams.subscribe(params => {
      this.email = params['email'] || '';
    });
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPassword(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  onSubmit(): void {
    if (!this.email || !this.otp || !this.newPassword || !this.confirmPassword) {
      this.errorMessage = 'Please fill in all fields';
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.errorMessage = 'Passwords do not match';
      return;
    }

    if (this.newPassword.length < 8) {
      this.errorMessage = 'Password must be at least 8 characters long';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const resetData = {
      email: this.email,
      otp: this.otp,
      newPassword: this.newPassword,
      confirmPassword: this.confirmPassword
    };

    this.authService.resetPassword(resetData).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.success) {
          this.successMessage = 'Password reset successful! Redirecting to login...';
          setTimeout(() => {
            this.router.navigate(['/auth/login']);
          }, 2000);
        } else {
          this.errorMessage = response.message || 'Failed to reset password';
        }
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Reset password error:', error);
        this.errorMessage = error.error?.message || 'Failed to reset password. Please try again.';
      }
    });
  }
}
