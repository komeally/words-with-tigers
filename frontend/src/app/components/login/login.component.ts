import { Component } from '@angular/core';
import { AuthService } from '../../services/auth/auth.service';
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
  errorMessage: string | null = null;

  constructor(
    private authService: AuthService,
    private usersService: UsersService
  ) {}

  login() {
    if (this.username && this.password) {
      this.authService.login(this.username, this.password).subscribe({
        next: (response) => {
          console.log('Login successful:', response);
          localStorage.setItem('authToken', response.access_token);
          this.errorMessage = null; // Clear error on success
        },
        error: (error) => {
          console.error('Login failed:', error);
          this.errorMessage = 'Login failed. Please check your credentials.';
        },
      });
    } else {
      this.errorMessage = 'Username and password are required.';
    }
  }

  register() {
    if (this.username && this.password) {
      this.usersService.registerUser(this.username, this.password).subscribe({
        next: (response) => {
          console.log('Registration successful:', response);
          this.errorMessage = null; // Clear error on success
  
          // Call the login function directly after registration
          this.login();
        },
        error: (error) => {
          console.error('Registration failed:', error);
          this.errorMessage = 'Registration failed. Please try again.';
        },
      });
    } else {
      this.errorMessage = 'Username and password are required.';
    }
  }  
}