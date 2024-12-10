import {
  WebSocketGateway,
  WebSocketServer,
  ConnectedSocket,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { LobbyService, Player } from './lobby.service';
import { AuthService } from 'src/auth/auth.service';
import { UserDocument } from 'src/users/schemas/user.schema';

@WebSocketGateway({
  namespace: '/lobby',
  cors: {
    origin: ['http://localhost:4200', 'http://localhost:4201'],
    credentials: true,
  },
})
export class LobbyGateway implements OnGatewayInit {
  @WebSocketServer()
  server: Server;

  constructor(
    private lobbyService: LobbyService,
    private authService: AuthService,
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

  handleConnection(@ConnectedSocket() client: Socket) {
    const user = client.data.user as UserDocument;
    const player: Player = {
      userId: user._id.toString(),
      username: user.username,
      socketId: client.id,
    };
  
    console.log(`Client connected: ${player.username}`);
    client.join('lobby');
  
    // Add player first
    this.lobbyService.addPlayer(player);
    // Then get the updated list
    const updatedPlayers = this.lobbyService.getPlayers();

    // Emit to the connecting client their initial state
    client.emit('currentPlayers', {
      players: updatedPlayers,
      currentUser: player,
    });
    
    // Broadcast to other clients that a new player joined
    client.broadcast.to('lobby').emit('updatePlayerList', {
      players: updatedPlayers
    });
  }

  handleDisconnect(@ConnectedSocket() client: Socket) {
    console.log(`Client disconnected: ${client.data.user.username}`);
    client.leave('lobby');

    const disconnectedPlayer = this.lobbyService.getPlayerBySocketId(client.id);
    if (disconnectedPlayer) {
      this.lobbyService.removePlayer(client.id);
      const updatedPlayers = this.lobbyService.getPlayers();
      
      // Broadcast to remaining clients
      this.server.to('lobby').emit('updatePlayerList', {
        players: updatedPlayers,
        currentUsername: '', // Empty string for disconnect events
      });
    }
  }
}
