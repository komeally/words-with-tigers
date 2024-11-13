import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { interval, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class TokenMonitorService {
  private readonly checkInterval = 10000; // Check every 10 seconds
  private stop$ = new Subject<void>();
  public tokenExpired$ = new Subject<void>();

  constructor(private router: Router) {
    this.startMonitoring();
  }

  private startMonitoring(): void {
    interval(this.checkInterval)
      .pipe(takeUntil(this.stop$))
      .subscribe(() => {
        const token = localStorage.getItem('access_token');
        if (token && this.isTokenExpired(token)) {
          this.tokenExpired$.next(); // Notify subscribers
          this.router.navigate(['/login']);
          localStorage.removeItem('access_token');
        }
      });
  }

  private isTokenExpired(token: string): boolean {
    const tokenPayload = JSON.parse(atob(token.split('.')[1]));
    const expirationTime = tokenPayload.exp * 1000; // Convert to ms
    return Date.now() > expirationTime;
  }

  stopMonitoring(): void {
    this.stop$.next();
  }
}