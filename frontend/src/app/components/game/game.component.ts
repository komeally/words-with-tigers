import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { ChatService } from '../../services/chat.service';
import { GameService } from '../../services/game.service';
import { GameState } from '../../store/state/game.state';
import { setGameState } from '../../store/actions/game.actions';
import { first } from 'rxjs';

@Component({
  selector: 'app-game',
  standalone: true,
  templateUrl: './game.component.html',
  styleUrl: './game.component.scss',
})
export class GameComponent implements OnInit, OnDestroy {
  private gameId: string | null = null;
  socketUser: { userId: string; username: string } | null = null;

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

    // Connect to the game gateway
    this.gameService.connectToGame(this.gameId, ''); // PlayerId will be emitted from the socketUser stream

    // Wait for socketUser to be set
    this.gameService.socketUser$.pipe(first()).subscribe((socketUser) => {
      if (!socketUser || !socketUser.userId) {
        console.error('Player ID is missing. Redirecting to login.');
        this.router.navigate(['/login']);
        return;
      }

      this.socketUser = socketUser;

      // Join the game chat room
      this.chatService.joinRoom(this.gameId!);

      // Fetch and set the game state
      this.fetchGameState();

      // Handle reconnection logic
      this.gameService
        .onReconnect(this.gameId!, this.socketUser.userId)
        .subscribe((gameState) => {
          if (gameState) {
            this.store.dispatch(setGameState({ gameState }));
          } else {
            console.error('Reconnection failed or no active game found.');
            this.router.navigate(['/lobby']);
          }
        });
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
    if (this.gameId && this.socketUser?.userId) {
      this.gameService.disconnectFromGame(this.gameId, this.socketUser.userId);
      this.chatService.leaveRoom(this.gameId);
    }
  }
}
