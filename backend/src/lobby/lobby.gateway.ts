import { WebSocketGateway, WebSocketServer, ConnectedSocket, OnGatewayInit } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { LobbyService } from './lobby.service';
import { AuthService } from 'src/auth/auth.service';

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

  constructor(private lobbyService: LobbyService, private authService: AuthService) {}

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
    console.log(client.data);
    
    console.log(`Client connected: ${client.data.user.username}`);
    client.join('lobby');

    // Add player and broadcast updated player list
    this.lobbyService.addPlayer(client.data.user.username);
    this.server.to('lobby').emit('updatePlayerList', this.lobbyService.getPlayers());

    client.emit('currentPlayers', this.lobbyService.getPlayers());
  }

  handleDisconnect(@ConnectedSocket() client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    client.leave('lobby');

    // Remove player and broadcast updated player list
    this.lobbyService.removePlayer(client.id);
    this.server.to('lobby').emit('updatePlayerList', this.lobbyService.getPlayers());
  }
}