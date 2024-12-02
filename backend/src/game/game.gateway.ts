import {
  ConnectedSocket,
  MessageBody,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { AuthService } from 'src/auth/auth.service';
import { GameService } from './game.service';

@WebSocketGateway({
  namespace: '/game',
  cors: {
    origin: 'http://localhost:4200',
  },
})
export class GameGateway implements OnGatewayInit {
  @WebSocketServer()
  server: Server;

  constructor(
    private authService: AuthService,
    private gameService: GameService,
  ) {}

  async afterInit(server: Server) {
    server.use(async (socket: Socket, next) => {
      try {
        await this.authService.authenticateSocket(socket);
        next();
      } catch (error) {
        console.error('Socket authentication failed:', error.message);
        next(new Error('Authentication error'));
      }
    });
    console.log('Gateway Initialized');
  }

   // Handle new client connections
   async handleConnection(client: Socket): Promise<void> {
    try {
      const playerId = client.handshake.auth.playerId; // Assuming playerId is passed during connection
      console.log(`Player connected: ${playerId}`);
      client.emit('connectionSuccess', { message: 'Connected to game server' });
    } catch (error) {
      console.error(`Error during connection: ${error.message}`);
      client.disconnect();
    }
  }

  // Handle client disconnections
  async handleDisconnect(client: Socket): Promise<void> {
    try {
      const playerId = client.handshake.auth.playerId; // Assuming playerId is passed during connection
      console.log(`Player disconnected: ${playerId}`);

      // Notify other players in the game
      const gameId = client.handshake.query.gameId as string;
      if (gameId && playerId) {
        this.server.to(gameId).emit('playerDisconnected', { playerId });
        // Optionally, mark the player as disconnected in the game state
        await this.gameService.markPlayerDisconnected(gameId, playerId);
      }
    } catch (error) {
      console.error(`Error during disconnection: ${error.message}`);
    }
  }

  @SubscribeMessage('joinGame')
  async handleJoinGame(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { gameId: string; playerId: string },
  ): Promise<void> {
    client.join(data.gameId);
    this.server.to(data.gameId).emit('playerJoined', {
      playerId: data.playerId,
    });
  }

  @SubscribeMessage('leaveGame')
  handleLeaveGame(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { gameId: string; playerId: string },
  ): void {
    client.leave(data.gameId);
    this.server.to(data.gameId).emit('playerLeft', {
      playerId: data.playerId,
    });
  }

  @SubscribeMessage('placeTiles')
  async handlePlaceTiles(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: {
      gameId: string;
      playerId: string;
      tiles: { row: number; col: number; letter: string }[];
    },
  ): Promise<void> {
    try {
      const word = data.tiles.map((tile) => tile.letter).join('');

      const { move, tilesDrawn } = await this.gameService.processTurn({
        gameId: data.gameId,
        playerId: data.playerId,
        moveType: 'PLACE',
        tiles: data.tiles,
        word,
      });

      this.server.to(data.gameId).emit('updateBoard', {
        playerId: data.playerId,
        tiles: data.tiles,
        moveNumber: move.moveNumber,
        score: move.score,
        tilesDrawn, // Include the new tiles drawn
      });
      console.log(
        `Player ${data.playerId} placed tiles in game ${data.gameId}`,
      );
    } catch (error) {
      client.emit('moveError', { message: error.message || 'Invalid move!' });
    }
  }

  @SubscribeMessage('passTurn')
  async handlePassTurn(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { gameId: string; playerId: string },
  ): Promise<void> {
    try {
      const { move } = await this.gameService.processTurn({
        gameId: data.gameId,
        playerId: data.playerId,
        moveType: 'PASS',
      });

      this.server.to(data.gameId).emit('turnPassed', {
        playerId: data.playerId,
        moveNumber: move.moveNumber,
      });
    } catch (error) {
      client.emit('moveError', { message: error.message || 'Invalid move!' });
    }
  }

  @SubscribeMessage('endGame')
  async handleEndGame(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { gameId: string },
  ): Promise<void> {
    try {
      const endReason = await this.gameService.finalizeGame(data.gameId);
      this.server.to(data.gameId).emit('gameEnded', {
        gameId: data.gameId,
        endReason,
      });
    } catch (error) {
      client.emit('gameError', {
        message: error.message || 'Game end failed!',
      });
    }
  }

  @SubscribeMessage('resignGame')
  async handleResign(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { gameId: string; playerId: string },
  ): Promise<void> {
    try {
      const endReason = await this.gameService.processTurn({
        gameId: data.gameId,
        playerId: data.playerId,
        moveType: 'RESIGN',
      });
      this.server
        .to(data.gameId)
        .emit('gameEnded', { gameId: data.gameId, endReason });
    } catch (error) {
      client.emit('gameError', {
        message: error.message || 'Resignation failed!',
      });
    }
  }
}
