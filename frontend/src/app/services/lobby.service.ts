import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { SocketService } from './socket.service';

@Injectable({
  providedIn: 'root',
})
export class LobbyService {
  constructor(private socketService: SocketService) {}

  // Connect to the lobby WebSocket namespace
  connectToLobby(): void {
    const socket = this.socketService.connect('lobby');
    if (socket) {
      socket.on('currentPlayers', (players: string[]) => {
        console.log('Current players:', players);
        // Additional code to update component state or emit events
      });

      socket.on('updatePlayerList', (players: string[]) => {
        console.log('Updated player list:', players);
        // Additional code to handle player list updates
      });
    } else {
      console.warn('Unable to connect to lobby: invalid or expired token');
    }
  }

  // Disconnect from the lobby WebSocket namespace
  disconnectFromLobby(): void {
    this.socketService.disconnect();
  }

  // Observable for player updates (optional if you want to make it reactive)
  onPlayerListUpdate(): Observable<string[]> {
    return new Observable((observer) => {
      const socket = this.socketService.getSocket();
      if (socket) {
        socket.on('updatePlayerList', (players: string[]) => {
          observer.next(players);
        });
      }
    });
  }
}