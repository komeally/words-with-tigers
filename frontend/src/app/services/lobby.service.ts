// src/app/services/lobby.service.ts
import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable } from 'rxjs';

const BACKEND_URL = 'http://localhost:3000';

@Injectable({
  providedIn: 'root',
})
export class LobbyService {
  private socket: Socket;

  constructor() {
    this.socket = io(`${BACKEND_URL}/lobby`, {
      auth: {
        token: localStorage.getItem('access_token'), // Assuming you store the JWT in localStorage
      },
    });
  }

  // Emit an event to join the lobby
  joinLobby(): void {
    this.socket.emit('joinLobby');
  }

  // Listen for the list of current players
  onCurrentPlayers(): Observable<string[]> {
    return new Observable((observer) => {
      this.socket.on('currentPlayers', (players: string[]) => {
        observer.next(players);
      });
    });
  }

  // Listen for updates to the player list
  onUpdatePlayerList(): Observable<string[]> {
    return new Observable((observer) => {
      this.socket.on('updatePlayerList', (players: string[]) => {
        observer.next(players);
      });
    });
  }

  // Clean up the connection when the service is destroyed
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
    }
  }
}
