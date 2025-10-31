import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-compliance-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './compliance-layout.html',
  styleUrls: ['./compliance-layout.css']
})
export class ComplianceLayout {
  isSidebarOpen = true;
  showUserMenu = false;
  currentOfficer: any = null;

  menuItems = [
    { path: '/compliance/dashboard', icon: 'dashboard', label: 'Dashboard', active: true },
    { path: '/compliance/alerts', icon: 'alert', label: 'Alerts', active: false },
    { path: '/compliance/transactions', icon: 'transactions', label: 'Transactions', active: false },
    { path: '/compliance/sar', icon: 'report', label: 'SAR Reports', active: false },
    { path: '/compliance/profile', icon: 'profile', label: 'Profile', active: false }
  ];

  constructor(
    private authService: AuthService,
    private router: Router
  ) {
    this.loadOfficerInfo();
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

  toggleSidebar(): void {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  toggleUserMenu(): void {
    this.showUserMenu = !this.showUserMenu;
  }

  setActiveMenu(path: string): void {
    this.menuItems.forEach(item => {
      item.active = item.path === path;
    });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }
}
