import { AsyncPipe, CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { LobbyService, Player } from '../../../services/lobby.service';
import { ButtonComponent } from '../../shared/button/button.component';
import { combineLatest, map, Observable } from 'rxjs';

@Component({
  selector: 'lobby-players',
  standalone: true,
  imports: [CommonModule, ButtonComponent, AsyncPipe],
  templateUrl: './players.component.html',
  styleUrl: './players.component.scss',
})
export class PlayersComponent implements OnInit, OnDestroy {
  filteredPlayers$: Observable<Player[]>;

  constructor(private lobbyService: LobbyService) {
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

  playGame(): void {}

  ngOnDestroy(): void {
    // Disconnect from the lobby WebSocket when the component is destroyed
    this.lobbyService.disconnectFromLobby();
  }
}
