import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { UsersService } from '../../services/users.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  username: string = '';
  password: string = '';

  constructor(private authService: AuthService, private usersService: UsersService) {}

  login() {
    if (this.username && this.password) {
      this.authService.login(this.username, this.password).subscribe({
        next: (response) => {
          console.log('Login successful:', response);
          localStorage.setItem('authToken', response.token);
        },
        error: (error) => {
          console.error('Login failed:', error);
        },
      });
    }
  }

  register() {
    if (this.username && this.password) {
      this.usersService.registerUser(this.username, this.password).subscribe({
        next: (response) => {
          console.log('Registration successful:', response);
        },
        error: (error) => {
          console.error('Registration failed:', error);
        },
      });
    }
  }
}