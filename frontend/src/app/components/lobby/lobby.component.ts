import { Component, OnDestroy, OnInit } from '@angular/core';
import { PlayersComponent } from './players/players.component';
import { ChatComponent } from '../shared/chat/chat.component';

@Component({
  selector: 'app-lobby',
  standalone: true,
  imports: [PlayersComponent, ChatComponent],
  templateUrl: './lobby.component.html',
  styleUrl: './lobby.component.scss'
})
export class LobbyComponent {
  
}