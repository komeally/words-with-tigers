import { Injectable } from '@angular/core';
import { BehaviorSubject, first, Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { SocketService } from './socket.service';
import { GameState } from '../store/state/game.state';

const BACKEND_URL = 'http://localhost:3000';

export interface User {
  userId: string;
  username: string;
}

@Injectable({
  providedIn: 'root',
})
export class GameService {
  private socketUserSubject = new BehaviorSubject<User | null>(null);
  private gameStateSubject = new BehaviorSubject<GameState | null>(null);
  private gameSocket: any;

  constructor(private socketService: SocketService, private http: HttpClient) {}

  // Getters to expose observables
  get socketUser$(): Observable<User | null> {
    return this.socketUserSubject.asObservable();
  }

  /** Observable for game state */
  get gameState$(): Observable<GameState | null> {
    return this.gameStateSubject.asObservable();
  }

  /** Set the game state */
  setGameState(state: GameState): void {
    this.gameStateSubject.next(state);
  }

  /** Initialize a new game */
  initializeGame(createdBy: string, playerIds: string[]): Observable<any> {
    return this.http.post(`${BACKEND_URL}/games/start`, {
      createdBy,
      playerIds,
    });
  }

  /** Fetch the current game state */
  getGameState(gameId: string): Observable<GameState> {
    return this.http.get<GameState>(`${BACKEND_URL}/games/${gameId}/state`);
  }

  /** Connect to the game socket */
  connectToGame(gameId: string, playerId: string): void {
    const socket = this.socketService.connect('game');
    if (socket) {
      this.gameSocket = socket;

      // Listen for the socketuser and set `socketUser`
      socket.on('socketUser', (user: User) => {
        console.log('Received socket user data:', user);
        this.socketUserSubject.next(user);
      });

      // Emit join event only after `socketUser` is set
      this.socketUser$.pipe(first()).subscribe((socketUser) => {
        if (socketUser) {
          socket.emit('joinGame', { gameId, playerId });
          console.log(`Joined game with user ID: ${socketUser.userId}`);
        } else {
          console.error('Socket user is not available.');
        }
      });

      // Listen for board updates
      socket.on('updateBoard', (update: any) => this.handleBoardUpdate(update));

      // Listen for game end events
      socket.on('gameEnded', (data: any) => {
        console.log('Game ended:', data);
      });

      // Listen for player disconnection
      socket.on('playerDisconnected', (data: any) => {
        console.log('Player disconnected:', data);
      });
    }
  }

  /** Disconnect from the game socket */
  disconnectFromGame(gameId: string, playerId: string): void {
    if (this.gameSocket) {
      this.gameSocket.emit('leaveGame', { gameId, playerId }); // Notify server
      this.socketService.disconnect('game'); // Disconnect the socket
      this.gameSocket = null; // Reset the socket reference
    }
  }

  onReconnect(gameId: string, playerId: string): Observable<GameState | null> {
    return new Observable((observer) => {
      if (this.gameSocket) {
        this.gameSocket.emit('reconnect', { gameId, playerId });

        // Listen for reconnection success or error
        this.gameSocket.on('reconnectSuccess', (gameState: GameState) => {
          observer.next(gameState); // Emit the updated game state
        });

        this.gameSocket.on('reconnectError', (error: any) => {
          console.error('Reconnection failed:', error.message);
          observer.next(null);
        });
      } else {
        console.warn('Socket is not initialized.');
        observer.next(null);
      }
    });
  }

  /** Process a turn */
  processTurn(
    gameId: string,
    playerId: string,
    moveType: 'PLACE' | 'PASS' | 'RESIGN',
    tiles?: { row: number; col: number; letter: string }[]
  ): void {
    if (this.gameSocket) {
      const payload = { gameId, playerId, tiles };
      if (moveType === 'PLACE' && tiles) {
        this.gameSocket.emit('placeTiles', payload);
      } else if (moveType === 'PASS') {
        this.gameSocket.emit('passTurn', payload);
      } else if (moveType === 'RESIGN') {
        this.gameSocket.emit('resignGame', payload);
      }
    }
  }

  /** Handle board updates */
  private handleBoardUpdate(update: any): void {
    const currentGameState = this.gameStateSubject.getValue();
    if (currentGameState) {
      const updatedState: GameState = {
        ...currentGameState,
        boardState: update.tiles.reduce((acc: any, tile: any) => {
          acc[`${tile.row}-${tile.col}`] = tile; // Map tiles to row-col keys
          return acc;
        }, {}),
        moves: [
          ...currentGameState.moves,
          {
            words: update.words || [],
            tiles: update.tiles.map((tile: any) => ({
              row: tile.row,
              col: tile.col,
              letter: tile.letter,
            })),
            score: update.score,
            moveType: 'PLACE',
            timestamp: new Date().toISOString(),
          },
        ],
      };
      this.setGameState(updatedState);
    }
  }
}
