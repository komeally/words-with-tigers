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
import { UserDocument } from 'src/users/schemas/user.schema';

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
  ) {}

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
    const user = client.data.user as UserDocument;
    const roomId = client.data.roomId || 'lobby';
  
    // Add the user to the room
    client.join(roomId);
  
    // Emit current user data back to the client
    client.emit('currentUser', {
      userId: user._id.toString(),
      username: user.username,
    });
  
    // Retrieve past messages in the room
    const messages = await this.chatService.getMessages(roomId);
  
    // Send chat history to the connected client
    client.emit('loadChatHistory', messages);
  
    console.log(
      `User ${user.username} connected to room ${roomId}`,
    );
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { content: string; recipients?: string[] },
  ) {
    const senderId = client.data.user.id;
    const roomId = client.data.roomId || 'lobby';

    // Save the message with references
    const savedMessage = await this.chatService.saveMessage(
      senderId,
      data.recipients || [],
      data.content,
      roomId,
    );

    // Populate the saved message
    const populatedMessage = await this.chatService.populateMessage(
      savedMessage._id.toString(),
    );

    // Broadcast the message to the room
    this.server.to(roomId).emit('receiveMessage', populatedMessage);
  }
}
