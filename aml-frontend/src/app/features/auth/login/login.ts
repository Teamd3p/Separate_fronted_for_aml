import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule  } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    LucideAngularModule
  ],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  showPassword = false;
  username = '';
  password = '';
  remember = true;
  recaptcha = false;

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  onLogin() {
    console.log('Username:', this.username);
    console.log('Password:', this.password);
    console.log('Remember:', this.remember);
    console.log('reCAPTCHA:', this.recaptcha);
  }
}
