// auth.guard.ts
import { Injectable, inject } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  private platformId = inject(PLATFORM_ID);

  constructor(private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    // Check if we're in the browser
    if (isPlatformBrowser(this.platformId)) {
      const isAuthenticated = !!localStorage.getItem('access_token');

      // If authenticated, allow access to the requested route
      if (isAuthenticated) {
        return true;
      } else {
        // If not authenticated, redirect to login
        this.router.navigate(['/login']);
        return false;
      }
    }

    // Default to redirecting to login if on the server or any other unexpected situation
    this.router.navigate(['/login']);
    return false;
  }
}
