import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Router } from '@angular/router';
import { interval, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

const BACKEND_URL = 'http://localhost:3000';

@Injectable({
  providedIn: 'root',
})
export class SocketService {
  private socket: Socket | null = null;
  private readonly checkInterval = 10000; // Check every 10 seconds
  private stop$ = new Subject<void>();

  constructor(private router: Router) {
    this.startTokenMonitoring();
  }

  private startTokenMonitoring(): void {
    interval(this.checkInterval)
      .pipe(takeUntil(this.stop$))
      .subscribe(() => {
        const token = localStorage.getItem('access_token');
        if (token && this.isTokenExpired(token)) {
          this.handleTokenExpiration();
        }
      });
  }

  private isTokenExpired(token: string): boolean {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const expiry = payload.exp * 1000;
    return Date.now() > expiry;
  }

  private handleTokenExpiration(): void {
    localStorage.removeItem('access_token');
    this.disconnect(); // Disconnect any active socket
    this.router.navigate(['/login']); // Redirect to login page
  }

  connect(namespace: string): Socket | null {
    const token = localStorage.getItem('access_token');
    if (!token || this.isTokenExpired(token)) {
      this.handleTokenExpiration();
      return null;
    }

    if (this.socket) this.disconnect();

    this.socket = io(`${BACKEND_URL}/${namespace}`, {
      auth: { token },
    });

    return this.socket;
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  getSocket(): Socket | null {
    return this.socket;
  }
}