import { Component, signal } from '@angular/core';
import { RegisterComponent } from './features/auth/register/register';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RegisterComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('aml-frontend');
}
