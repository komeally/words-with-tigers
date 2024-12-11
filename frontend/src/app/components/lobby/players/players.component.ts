import { AsyncPipe, CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { LobbyService, Player } from '../../../services/lobby.service';
import { ButtonComponent } from '../../shared/button/button.component';
import { combineLatest, first, map, Observable } from 'rxjs';
import { GameService } from '../../../services/game.service';
import { Router } from '@angular/router';

@Component({
  selector: 'lobby-players',
  standalone: true,
  imports: [CommonModule, ButtonComponent, AsyncPipe],
  templateUrl: './players.component.html',
  styleUrl: './players.component.scss',
})
export class PlayersComponent implements OnInit, OnDestroy {
  filteredPlayers$: Observable<Player[]>;

  constructor(
    private lobbyService: LobbyService,
    private gameService: GameService,
    private router: Router
  ) {
    // Combine current user and players streams to filter out current user
    this.filteredPlayers$ = combineLatest([
      this.lobbyService.currentUser$,
      this.lobbyService.players$,
    ]).pipe(
      map(([currentUser, players]) => {
        if (!currentUser) return players;
        return players.filter((p) => p.userId !== currentUser.userId);
      })
    );
  }

  ngOnInit(): void {
    this.lobbyService.connectToLobby();
  }

  playGame(opponentId: string): void {
    this.lobbyService.currentUser$.pipe(first()).subscribe((currentUser) => {
      if (!currentUser) {
        console.error('Current user not found!');
        return;
      }
  
      // Initialize the game
      this.gameService
        .initializeGame(currentUser.userId, [currentUser.userId, opponentId])
        .subscribe({
          next: (game) => {
            console.log('Game initialized:', game);
  
            // Set global game state
            this.gameService.getGameState(game._id).subscribe((gameState) => {
              this.gameService.setGameState(gameState);
  
              // Connect to game socket and navigate to the game with gameId as a route parameter
              this.gameService.connectToGame(game._id, currentUser.userId);
              this.router.navigate(['/game', game._id]);
            });
          },
          error: (err) => {
            console.error('Failed to initialize game:', err);
          },
        });
  
      // Disconnect from lobby
      this.lobbyService.disconnectFromLobby();
    });
  }
  
  ngOnDestroy(): void {
    // Disconnect from the lobby WebSocket when the component is destroyed
    this.lobbyService.disconnectFromLobby();
  }
}
