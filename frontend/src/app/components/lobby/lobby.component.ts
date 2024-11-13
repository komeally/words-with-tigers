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

  sendMessage(): void {
    console.log("Test");
  }
}