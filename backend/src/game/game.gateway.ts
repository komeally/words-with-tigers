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
import { UserDocument } from 'src/users/schemas/user.schema';

@WebSocketGateway({
  namespace: '/game',
  cors: {
    origin: ['http://localhost:4200', 'http://localhost:4201'], // Add both ports
    methods: ['GET', 'POST'], // Allowed HTTP methods
    credentials: true, // Allow cookies if necessary
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
  async handleConnection(@ConnectedSocket() client: Socket): Promise<void> {
    try {
      const user = client.data.user as UserDocument;
      console.log(`Player ${user.username} connected.`);
      
      client.emit('socketUser', {
        userId: user._id.toString(),
        username: user.username,
      });

      client.emit('connectionSuccess', {
        message: 'Connected to game server',
      });
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

  @SubscribeMessage('reconnect')
  async handleReconnect(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { gameId: string; playerId: string },
  ): Promise<void> {
    try {
      client.join(data.gameId); // Rejoin the game room
      const gameState = await this.gameService.getGameState(data.gameId);

      // Emit updated game state to the reconnecting client
      client.emit('reconnectSuccess', gameState);
    } catch (error) {
      client.emit('reconnectError', {
        message: error.message || 'Reconnect failed!',
      });
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
  async handleLeaveGame(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { gameId: string; playerId: string },
  ): Promise<void> {
    try {
      client.leave(data.gameId); // Leave the game room
      this.server
        .to(data.gameId)
        .emit('playerLeft', { playerId: data.playerId });

      // Optionally, mark the player as inactive
      await this.gameService.markPlayerDisconnected(data.gameId, data.playerId);
    } catch (error) {
      client.emit('leaveGameError', {
        message: error.message || 'Failed to leave game!',
      });
    }
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
      const { move, tilesDrawn } = await this.gameService.processTurn({
        gameId: data.gameId,
        playerId: data.playerId,
        moveType: 'PLACE',
        tiles: data.tiles,
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
