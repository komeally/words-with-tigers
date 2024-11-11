// src/chat/chat.gateway.ts
import { WebSocketGateway, WebSocketServer, SubscribeMessage, ConnectedSocket, MessageBody, OnGatewayInit } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { AuthService } from 'src/auth/auth.service';

@WebSocketGateway({
  namespace: '/chat',
  cors: {
    origin: 'http://localhost:4200',
  },
})
export class ChatGateway implements OnGatewayInit {
  @WebSocketServer()
  server: Server;

  constructor(private chatService: ChatService, private authService: AuthService) {}

  afterInit(server: Server) {
    server.use(async (socket: Socket, next) => {
        try {
          await this.authService.authenticateSocket(socket);
          next();
        } catch (error) {
          console.error('Socket authentication failed:', error.message);
          next(new Error('Authentication error'));
        }
    });
    console.log('Chat Gateway Initialized');
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { recipient: string; content: string }
  ) {
    const sender = client.data.user.id; // Assuming user ID is set in `socket.data` after auth

    // Store message in the database
    const savedMessage = await this.chatService.saveMessage(sender, data.recipient, data.content);

    // Emit message to recipient
    this.server.to(data.recipient).emit('receiveMessage', savedMessage);
  }
}
