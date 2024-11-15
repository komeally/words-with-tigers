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
  private connections: { [namespace: string]: Socket } = {}; // Store multiple sockets
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
    this.disconnectAll(); // Disconnect all active sockets
    this.router.navigate(['/login']); // Redirect to login page
  }

  connect(namespace: string): Socket | null {
    const token = localStorage.getItem('access_token');
    if (!token || this.isTokenExpired(token)) {
      this.handleTokenExpiration();
      return null;
    }

    // Avoid reconnecting if already connected to the namespace
    if (this.connections[namespace]) {
      return this.connections[namespace];
    }

    // Create a new connection for the namespace
    const socket = io(`${BACKEND_URL}/${namespace}`, {
      auth: { token },
    });

    // Store the connection
    this.connections[namespace] = socket;

    socket.on('connect', () => {
      console.log(`Connected to ${namespace} namespace`);
    });

    socket.on('disconnect', () => {
      console.log(`Disconnected from ${namespace} namespace`);
      delete this.connections[namespace]; // Clean up on disconnect
    });

    return socket;
  }

  disconnect(namespace: string): void {
    const socket = this.connections[namespace];
    if (socket) {
      socket.disconnect();
      delete this.connections[namespace];
    }
  }

  disconnectAll(): void {
    Object.keys(this.connections).forEach((namespace) => {
      this.disconnect(namespace);
    });
  }

  getSocket(namespace: string): Socket | null {
    return this.connections[namespace] || null;
  }
}