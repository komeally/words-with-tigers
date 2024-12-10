import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { SocketService } from './socket.service';

export type Player = {
  userId: string;
  username: string;
  socketId: string;
};

@Injectable({
  providedIn: 'root',
})
export class LobbyService {
  constructor(private socketService: SocketService) {}
  private currentUserSubject = new BehaviorSubject<Player | null>(null);
  private playersSubject = new BehaviorSubject<Player[]>([]);

  get currentUser$() {
    return this.currentUserSubject.asObservable();
  }

  get players$() {
    return this.playersSubject.asObservable();
  }

  // Connect to the lobby WebSocket namespace
  connectToLobby(): void {
    const socket = this.socketService.connect('lobby');
    if (socket) {
      socket.on('currentPlayers', (data: { players: Player[]; currentUser: Player }) => {
        this.currentUserSubject.next(data.currentUser);
        this.playersSubject.next(data.players);
        console.log('Current players:', data);
      });

      // Handle updates
      socket.on('updatePlayerList', (data: { players: Player[] }) => {
        this.playersSubject.next(data.players);
      });
    } else {
      console.warn('Unable to connect to lobby: invalid or expired token');
    }
  }

  // Disconnect from the lobby WebSocket namespace
  disconnectFromLobby(): void {
    this.socketService.disconnect('lobby');
    this.currentUserSubject.next(null);
    this.playersSubject.next([]);
  }
}