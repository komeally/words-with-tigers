import { Injectable } from '@nestjs/common';

@Injectable()
export class LobbyService {
  private players: Set<string> = new Set(); // Store connected player IDs

  addPlayer(playerId: string) {
    this.players.add(playerId);
  }

  removePlayer(playerId: string) {
    this.players.delete(playerId);
  }

  getPlayers(): string[] {
    return Array.from(this.players);
  }
}
