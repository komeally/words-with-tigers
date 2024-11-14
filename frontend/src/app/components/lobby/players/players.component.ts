import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { LobbyService } from '../../../services/lobby.service';

@Component({
  selector: 'lobby-players',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './players.component.html',
  styleUrl: './players.component.scss'
})
export class PlayersComponent implements OnInit, OnDestroy {
  players: string[] = [];

  constructor(private lobbyService: LobbyService) {}

  ngOnInit(): void {
    // Connect to the lobby WebSocket
    this.lobbyService.connectToLobby();

    // Listen for the current list of players when connected
    this.lobbyService.onPlayerListUpdate().subscribe((players) => {
      this.players = players;
    });
  }

  ngOnDestroy(): void {
    // Disconnect from the lobby WebSocket when the component is destroyed
    this.lobbyService.disconnectFromLobby();
  }
}
