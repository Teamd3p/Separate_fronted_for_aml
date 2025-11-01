import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { filter } from 'rxjs/operators';

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

  constructor(
    private authService: AuthService,
    private router: Router
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
    if (this.passwordData.newPassword !== this.passwordData.confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    
    // Call API to change password
    console.log('Changing password...');
    this.closeChangePasswordModal();
    alert('Password changed successfully');
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }
}
