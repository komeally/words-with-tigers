import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { ChatService } from '../../services/chat.service';
import { GameService } from '../../services/game.service';
import { GameState } from '../../store/state/game.state';
import { setGameState } from '../../store/actions/game.actions';

@Component({
  selector: 'app-game',
  standalone: true,
  templateUrl: './game.component.html',
  styleUrl: './game.component.scss',
})
export class GameComponent implements OnInit, OnDestroy {
  private gameId: string | null = null;
  private playerId: string | null = null;

  constructor(
    private gameService: GameService,
    private chatService: ChatService,
    private router: Router,
    private route: ActivatedRoute,
    private store: Store<{ game: GameState }>
  ) {}

  ngOnInit(): void {
    // Get gameId from route parameters
    this.gameId = this.route.snapshot.paramMap.get('gameId');
    if (!this.gameId) {
      console.error('Game ID is missing. Redirecting to lobby.');
      this.router.navigate(['/lobby']);
      return;
    }

    // Retrieve player ID from GameService
    const currentUser = this.gameService.currentUser$.getValue();
    if (!currentUser?.userId) {
      console.error('Player ID is missing. Redirecting to login.');
      this.router.navigate(['/login']);
      return;
    }

    this.playerId = currentUser.userId;

    // Connect to game gateway
    this.gameService.connectToGame(this.gameId, this.playerId);

    // Join the game chat room
    this.chatService.joinRoom(this.gameId);

    // Fetch and set the game state
    this.fetchGameState();

    // Handle reconnection logic
    this.gameService
      .onReconnect(this.gameId!, this.playerId)
      .subscribe((gameState) => {
        if (gameState) {
          this.store.dispatch(setGameState({ gameState }));
        } else {
          console.error('Reconnection failed or no active game found.');
          this.router.navigate(['/lobby']);
        }
      });
  }

  fetchGameState(): void {
    this.gameService.getGameState(this.gameId!).subscribe({
      next: (gameState: GameState) => {
        this.store.dispatch(setGameState({ gameState }));
      },
      error: () => {
        console.error('Failed to fetch game state. Redirecting to lobby.');
        this.router.navigate(['/lobby']);
      },
    });
  }

  ngOnDestroy(): void {
    if (this.gameId && this.playerId) {
      this.gameService.disconnectFromGame(this.gameId, this.playerId);
      this.chatService.leaveRoom(this.gameId);
    }
  }
}
