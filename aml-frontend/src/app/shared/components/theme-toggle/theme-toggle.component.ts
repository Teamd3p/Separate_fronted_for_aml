import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-theme-toggle',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <button 
      (click)="toggleTheme()" 
      class="theme-toggle-btn"
      [attr.aria-label]="isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'"
    >
      <lucide-icon [name]="isDarkMode ? 'sun' : 'moon'"></lucide-icon>
    </button>
  `,
  styles: [`
    .theme-toggle-btn {
      background: none;
      border: none;
      cursor: pointer;
      padding: 8px;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background-color 0.2s ease;
    }
    
    .theme-toggle-btn:hover {
      background-color: rgba(0, 0, 0, 0.1);
    }
    
    .theme-toggle-btn:focus {
      outline: 2px solid #007bff;
      outline-offset: 2px;
    }
  `]
})
export class ThemeToggleComponent implements OnInit {
  isDarkMode = false;

  ngOnInit() {
    // Check for saved theme preference or default to light mode
    const savedTheme = localStorage.getItem('theme');
    this.isDarkMode = savedTheme === 'dark';
    this.applyTheme();
  }

  toggleTheme() {
    this.isDarkMode = !this.isDarkMode;
    this.applyTheme();
    localStorage.setItem('theme', this.isDarkMode ? 'dark' : 'light');
  }

  private applyTheme() {
    if (this.isDarkMode) {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }
  }
}