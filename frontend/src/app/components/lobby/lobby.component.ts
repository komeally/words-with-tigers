import { Component, OnDestroy, OnInit } from '@angular/core';
import { ButtonComponent } from '../shared/button/button.component';
import { LobbyService } from '../../services/lobby.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-lobby',
  standalone: true,
  imports: [ButtonComponent, CommonModule],
  templateUrl: './lobby.component.html',
  styleUrl: './lobby.component.scss'
})
export class LobbyComponent implements OnInit, OnDestroy {
  players: string[] = [];

  constructor(private lobbyService: LobbyService) {}

  ngOnInit(): void {
    // Join the lobby and get the initial list of players
    this.lobbyService.joinLobby();

    // Listen for the current list of players when connected
    this.lobbyService.onCurrentPlayers().subscribe((players) => {
      this.players = players;
    });

    // Listen for updates to the player list
    this.lobbyService.onUpdatePlayerList().subscribe((players) => {
      this.players = players;
    });
  }

  ngOnDestroy(): void {
    // Disconnect the socket when the component is destroyed
    this.lobbyService.disconnect();
  }
}