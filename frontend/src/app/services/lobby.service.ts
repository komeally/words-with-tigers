import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { SocketService } from './socket.service';

export interface Player {
  userId: string;
  username: string;
  socketId: string;
}

@Injectable({
  providedIn: 'root',
})
@Injectable({
  providedIn: 'root',
})
export class LobbyService {
  private socketUserSubject = new BehaviorSubject<Player | null>(null);
  private playersSubject = new BehaviorSubject<Player[]>([]);

  constructor(private socketService: SocketService) {}

  // Getters to expose observables
  get socketUser$(): Observable<Player | null> {
    return this.socketUserSubject.asObservable();
  }

  get players$(): Observable<Player[]> {
    return this.playersSubject.asObservable();
  }

  connectToLobby(): void {
    const socket = this.socketService.connect('lobby');
    if (socket) {
      // Emit current user data
      socket.on('socketUser', (socketUser: Player) => {
        console.log('Socket User Received:', socketUser); // Debug log
        this.socketUserSubject.next(socketUser);
      });

      // Emit players list
      socket.on('currentPlayers', (data: { players: Player[] }) => {
        console.log('Players List Received:', data.players); // Debug log
        this.playersSubject.next(data.players);
      });

      socket.on('updatePlayerList', (data: { players: Player[] }) => {
        console.log('Updated Players List:', data.players); // Debug log
        this.playersSubject.next(data.players);
      });
    }
  }

  disconnectFromLobby(): void {
    this.socketService.disconnect('lobby');
    this.playersSubject.next([]); // Clear the players list
  }
}
