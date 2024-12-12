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
    this.filteredPlayers$ = combineLatest([
      this.lobbyService.socketUser$,
      this.lobbyService.players$,
    ]).pipe(
      map(([socketUser, players]) => {
        if (!players) return [];
        if (!socketUser) return players;
        return players.filter((p: Player) => p.userId !== socketUser.userId);
      })
    );
  }

  ngOnInit(): void {
    this.lobbyService.connectToLobby();
  }

  playGame(opponentId: string): void {
    this.lobbyService.socketUser$.pipe(first()).subscribe((socketUser) => {
      if (!socketUser) {
        console.error('Socket user not found!');
        return;
      }

      this.gameService
        .initializeGame(socketUser.userId, [socketUser.userId, opponentId])
        .subscribe({
          next: (game) => {
            console.log('Game initialized:', game);

            this.gameService.getGameState(game._id).subscribe((gameState) => {
              this.gameService.setGameState(gameState);

              this.gameService.connectToGame(game._id, socketUser.userId);
              this.router.navigate(['/game', game._id]);
            });
          },
          error: (err) => {
            console.error('Failed to initialize game:', err);
          },
        });

      this.lobbyService.disconnectFromLobby();
    });
  }

  ngOnDestroy(): void {
    this.lobbyService.disconnectFromLobby();
  }
}
