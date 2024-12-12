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

  async handleConnection(@ConnectedSocket() client: Socket) {
    const user = client.data.user as UserDocument;
    const player: Player = {
      userId: user._id.toString(),
      username: user.username,
      socketId: client.id,
    };

    client.join('lobby');
  
    // Emit `socketUser` to the client
    client.emit('socketUser', {
      userId: user._id.toString(),
      username: user.username,
    });
  
    // Add player to the lobby and broadcast updates
    this.lobbyService.addPlayer(player);
    const updatedPlayers = this.lobbyService.getPlayers();
  
    client.emit('currentPlayers', {
      players: updatedPlayers,
      socketUser: player,
    });
  
    client.broadcast.to('lobby').emit('updatePlayerList', {
      players: updatedPlayers,
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
        socketUsername: '', // Empty string for disconnect events
      });
    }
  }
}
