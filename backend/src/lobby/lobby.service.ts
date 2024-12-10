import { Injectable } from '@nestjs/common';

export type Player = {
  userId: string;  // The user's unique ID
  username: string; // The username
  socketId: string; // The socket ID associated with the connection
};

@Injectable()
export class LobbyService {
  private players: Map<string, Player> = new Map(); // Use Map for O(1) lookups

  addPlayer(player: Player): void {
    this.players.set(player.socketId, player);
  }

  removePlayer(socketId: string): void {
    this.players.delete(socketId);
  }

  getPlayers(): Player[] {
    return Array.from(this.players.values());
  }

  getPlayerBySocketId(socketId: string): Player | undefined {
    return this.players.get(socketId);
  }
}