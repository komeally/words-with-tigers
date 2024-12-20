import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { SocketService } from './socket.service';

export type ChatMessage = {
  sender: { _id: string; username: string };
  content: string;
  timestamp: Date;
};

@Injectable({
  providedIn: 'root',
})
export class ChatService {
  private socketUserSubject = new BehaviorSubject<{
    userId: string;
    username: string;
  } | null>(null);
  private messagesSubject = new BehaviorSubject<ChatMessage[]>([]);

  constructor(private socketService: SocketService) {}

  // Expose observables for Socket user and chat messages
  get socketUser$(): Observable<{ userId: string; username: string } | null> {
    return this.socketUserSubject.asObservable();
  }

  get messages$(): Observable<ChatMessage[]> {
    return this.messagesSubject.asObservable();
  }

  // Connect to the chat namespace
  connect(): void {
    const socket = this.socketService.connect('chat');
    if (socket) {
      // Listen for the Socket user's information
      socket.on('socketUser', (user: { userId: string; username: string }) => {
        this.socketUserSubject.next(user);
      });

      // Listen for new messages
      socket.on('receiveMessage', (message: ChatMessage) => {
        this.messagesSubject.next([...this.messagesSubject.value, message]);
      });

      // Listen for chat history
      socket.on('loadChatHistory', (messages: ChatMessage[]) => {
        this.messagesSubject.next(messages);
      });
    }
  }

  // Disconnect from the chat namespace
  disconnect(): void {
    this.socketService.disconnect('chat');
    this.socketUserSubject.next(null); // Reset Socket user state
    this.messagesSubject.next([]); // Clear messages state
  }

  // Send a message
  sendMessage(content: string): void {
    const socket = this.socketService.getSocket('chat');
    if (socket) {
      socket.emit('sendMessage', { content });
    }
  }

  joinRoom(roomId: string): void {
    const socket = this.socketService.getSocket('chat');
    if (socket) {
      socket.emit('joinRoom', roomId);
      console.log(`Joined chat room: ${roomId}`);
    }
  }

  leaveRoom(roomId: string): void {
    const socket = this.socketService.getSocket('chat');
    if (socket) {
      socket.emit('leaveRoom', roomId);
      console.log(`Left chat room: ${roomId}`);
    }
  }

  reconnectToRoom(roomId: string): void {
    const socket = this.socketService.getSocket('chat');
    if (socket) {
      socket.emit('joinRoom', roomId); // Rejoin the chat room
      console.log(`Reconnected to chat room: ${roomId}`);
    }
  }
}
