// src/chat/chat.gateway.ts
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { AuthService } from 'src/auth/auth.service';

@WebSocketGateway({
  namespace: '/chat',
  cors: {
    origin: ['http://localhost:4200', 'http://localhost:4201'],
    credentials: true,
  },
})
export class ChatGateway implements OnGatewayInit {
  @WebSocketServer()
  server: Server;

  constructor(
    private chatService: ChatService,
    private authService: AuthService,
  ) { }

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

  async handleConnection(@ConnectedSocket() client: Socket) {
    const userId = client.data.user.id;
    const roomId = client.data.roomId || 'lobby';
  
    // Add the user to the room
    client.join(roomId);
  
    // Retrieve past messages if more than two users are connected in the room
    const activeUserCount = await this.getActiveUserCountInLobby(roomId);
    if (activeUserCount > 2) {
      const messages = await this.chatService.getMessagesBetweenUsers(userId, null, roomId);
  
      // Populate sender and recipient fields
      const populatedMessages = await this.chatService.populateMessages(messages);
  
      client.emit('loadChatHistory', populatedMessages);
    }
  
    console.log(`User ${client.data.user.username} connected to room ${roomId}`);
  }
  
  @SubscribeMessage('sendMessage')
  async handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { content: string }
  ) {
    const senderId = client.data.user.id;
    const roomId = client.data.roomId || 'lobby'; // Default to 'lobby' if no specific room is provided

    // Save the message in the database with references
    const savedMessage = await this.chatService.saveMessage(senderId, null, data.content, roomId);

    // Populate the saved message with user data
    const populatedMessage = await this.chatService.populateMessage(savedMessage._id);

    // Broadcast the message to the room
    this.server.to(roomId).emit('receiveMessage', populatedMessage);
  }

  // Helper function to count active users in the lobby (room)
  async getActiveUserCountInLobby(roomId: string): Promise<number> {
    const sockets = await this.server.in(roomId).fetchSockets();
    return sockets.length;
  }
}
