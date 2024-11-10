// auth.guard.ts
import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(private router: Router) {}

  canActivate(): boolean {
    const isAuthenticated = !!localStorage.getItem('access_token'); // or however you check auth

    if (isAuthenticated) {
      this.router.navigate(['/lobby']);
      return false;  // Prevents further navigation to `/` if logged in
    } else {
      this.router.navigate(['/login']);
      return false;  // Prevents further navigation to `/` if not logged in
    }
  }
}