import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="dashboard-container">
      <header class="dashboard-header">
        <div class="logo">
          <div class="logo-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7V10C2 16 6 20.5 12 22C18 20.5 22 16 22 10V7L12 2Z" stroke="#007AFF" stroke-width="2" fill="none"/>
            </svg>
          </div>
          <span class="logo-text">FinTrace</span>
        </div>
        <div class="user-info">
          <span>Welcome, {{ userEmail }}</span>
          <button (click)="logout()" class="logout-btn">Logout</button>
        </div>
      </header>
      
      <main class="dashboard-content">
        <h1>Dashboard</h1>
        <p>Welcome to your AML Dashboard. You have successfully logged in!</p>
        
        <div class="dashboard-cards">
          <div class="card">
            <h3>Transactions</h3>
            <p>Monitor and analyze financial transactions</p>
          </div>
          <div class="card">
            <h3>Compliance</h3>
            <p>Manage compliance reports and alerts</p>
          </div>
          <div class="card">
            <h3>KYC Documents</h3>
            <p>Review and verify customer documents</p>
          </div>
        </div>
      </main>
    </div>
  `,
  styles: [`
    .dashboard-container {
      min-height: 100vh;
      background-color: #f8fafc;
    }
    
    .dashboard-header {
      background: white;
      padding: 1rem 2rem;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .logo {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    
    .logo-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      background-color: #e0f2fe;
      border-radius: 8px;
    }
    
    .logo-text {
      font-size: 1.5rem;
      font-weight: 600;
      color: #1e293b;
    }
    
    .user-info {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    
    .logout-btn {
      background: #dc2626;
      color: white;
      border: none;
      padding: 0.5rem 1rem;
      border-radius: 6px;
      cursor: pointer;
      font-size: 0.875rem;
    }
    
    .logout-btn:hover {
      background: #b91c1c;
    }
    
    .dashboard-content {
      padding: 2rem;
    }
    
    .dashboard-cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 1.5rem;
      margin-top: 2rem;
    }
    
    .card {
      background: white;
      padding: 1.5rem;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    
    .card h3 {
      margin-bottom: 0.5rem;
      color: #1e293b;
    }
    
    .card p {
      color: #64748b;
    }
  `]
})
export class DashboardComponent implements OnInit {
  userEmail: string = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.userEmail = localStorage.getItem('email') || 'User';
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }
}
