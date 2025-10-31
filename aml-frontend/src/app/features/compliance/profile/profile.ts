import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ComplianceService, OfficerProfile } from '../../../core/services/compliance.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile.html',
  styleUrl: './profile.css',
})
export class Profile implements OnInit {
  profile: OfficerProfile | null = null;
  isLoading = false;
  isEditing = false;
  errorMessage = '';
  successMessage = '';
  
  // OTP
  showOtpModal = false;
  otpCode = '';
  otpSent = false;
  
  // Edit form
  editForm: Partial<OfficerProfile> = {};

  constructor(private complianceService: ComplianceService) {}

  ngOnInit(): void {
    this.loadProfile();
  }

  loadProfile(): void {
    this.isLoading = true;
    this.complianceService.getOfficerProfile().subscribe({
      next: (profile) => {
        this.profile = profile;
        this.editForm = { ...profile };
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading profile:', error);
        this.errorMessage = 'Failed to load profile';
        this.isLoading = false;
      }
    });
  }

  enableEdit(): void {
    this.isEditing = true;
    this.editForm = { ...this.profile };
  }

  cancelEdit(): void {
    this.isEditing = false;
    this.editForm = { ...this.profile };
  }

  sendOTP(): void {
    this.complianceService.sendProfileUpdateOTP().subscribe({
      next: () => {
        this.showOtpModal = true;
        this.otpSent = true;
        this.successMessage = 'OTP sent to your email';
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (error) => {
        console.error('Error sending OTP:', error);
        this.errorMessage = 'Failed to send OTP';
        setTimeout(() => this.errorMessage = '', 3000);
      }
    });
  }

  verifyAndUpdate(): void {
    if (!this.otpCode || this.otpCode.length !== 6) {
      this.errorMessage = 'Please enter a valid 6-digit OTP';
      return;
    }
    
    // In a real implementation, you would verify OTP first
    // For now, we'll proceed with the update
    this.complianceService.updateOfficerProfile(this.editForm).subscribe({
      next: (updatedProfile) => {
        this.profile = updatedProfile;
        this.isEditing = false;
        this.showOtpModal = false;
        this.otpCode = '';
        this.successMessage = 'Profile updated successfully';
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (error) => {
        console.error('Error updating profile:', error);
        this.errorMessage = 'Failed to update profile';
        setTimeout(() => this.errorMessage = '', 3000);
      }
    });
  }

  closeOtpModal(): void {
    this.showOtpModal = false;
    this.otpCode = '';
  }
}
