import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../../../core/services/auth.service';
import { filter } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';

interface Notification {
  id: number;
  title: string;
  message: string;
  time: string;
  type: string;
  read: boolean;
}

@Component({
  selector: 'app-compliance-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './compliance-layout.html',
  styleUrls: ['./compliance-layout.css']
})
export class ComplianceLayout {
  isSidebarOpen = true;
  showUserMenu = false;
  showNotifications = false;
  showChangePasswordModal = false;
  currentOfficer: any = null;
  
  // Notifications
  notifications: Notification[] = [];
  unreadNotifications = 0;
  
  // Password Change
  passwordData = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  };

  private apiUrl = environment.apiUrl;

  constructor(
    private authService: AuthService,
    private router: Router,
    private http: HttpClient
  ) {
    this.loadOfficerInfo();
    this.loadNotifications();
    
    // Listen to route changes to update page title
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.getPageTitle();
    });
  }

  loadOfficerInfo(): void {
    // Get officer info from auth service or local storage
    const user = this.authService.getCurrentUser();
    this.currentOfficer = user || {
      firstName: 'Compliance',
      lastName: 'Officer',
      email: localStorage.getItem('email') || 'officer@aml.com'
    };
  }

  loadNotifications(): void {
    // Mock notifications - replace with actual API call
    this.notifications = [
      {
        id: 1,
        title: 'New Alert Assigned',
        message: 'Alert #1234 has been assigned to you',
        time: '5 minutes ago',
        type: 'alert',
        read: false
      },
      {
        id: 2,
        title: 'SAR Submitted',
        message: 'SAR #567 has been successfully submitted',
        time: '1 hour ago',
        type: 'success',
        read: false
      }
    ];
    this.unreadNotifications = this.notifications.filter(n => !n.read).length;
  }

  getPageTitle(): string {
    const url = this.router.url;
    if (url.includes('/dashboard')) return 'Dashboard';
    if (url.includes('/alerts')) return 'Alert Management';
    if (url.includes('/transactions')) return 'Transactions';
    if (url.includes('/sar')) return 'SAR Reports';
    if (url.includes('/tickets')) return 'Support Tickets';
    if (url.includes('/profile')) return 'Profile';
    return 'Compliance Officer';
  }

  toggleSidebar(): void {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  toggleUserMenu(): void {
    this.showUserMenu = !this.showUserMenu;
    if (this.showUserMenu) {
      this.showNotifications = false;
    }
  }

  toggleNotifications(): void {
    this.showNotifications = !this.showNotifications;
    if (this.showNotifications) {
      this.showUserMenu = false;
    }
  }

  markAllAsRead(): void {
    this.notifications.forEach(n => n.read = true);
    this.unreadNotifications = 0;
  }

  handleNotificationClick(notification: Notification): void {
    notification.read = true;
    this.unreadNotifications = this.notifications.filter(n => !n.read).length;
    // Handle navigation based on notification type
  }

  openChangePasswordModal(): void {
    this.showChangePasswordModal = true;
    this.showUserMenu = false;
  }

  closeChangePasswordModal(): void {
    this.showChangePasswordModal = false;
    this.passwordData = {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    };
  }

  changePassword(): void {
    // Validation
    if (!this.passwordData.currentPassword) {
      alert('Current password is required!');
      return;
    }

    if (!this.passwordData.newPassword) {
      alert('New password is required!');
      return;
    }

    if (this.passwordData.newPassword !== this.passwordData.confirmPassword) {
      alert('New passwords do not match!');
      return;
    }

    if (this.passwordData.newPassword.length < 8) {
      alert('Password must be at least 8 characters long!');
      return;
    }

    // API call to change password
    const token = localStorage.getItem('token');
    
    if (!token) {
      alert('Session expired. Please login again.');
      this.router.navigate(['/auth/login']);
      return;
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    const payload = {
      currentPassword: this.passwordData.currentPassword,
      newPassword: this.passwordData.newPassword,
      confirmPassword: this.passwordData.confirmPassword
    };

    console.log('Changing password...');
    
    this.http.post(`${this.apiUrl}/auth/change-password`, payload, { headers })
      .subscribe({
        next: (response: any) => {
          console.log('Password change successful:', response);
          alert(response.message || 'Password changed successfully!');
          this.closeChangePasswordModal();
        },
        error: (error) => {
          console.error('Password change error:', error);
          
          let errorMessage = 'Failed to change password.';
          
          if (error.status === 401) {
            errorMessage = 'Current password is incorrect.';
          } else if (error.error?.message) {
            errorMessage = error.error.message;
          }
          
          alert(errorMessage);
        }
      });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }
}
