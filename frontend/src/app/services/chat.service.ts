// src/app/services/chat.service.ts
import { Injectable } from '@angular/core';
import { SocketService } from './socket.service';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class ChatService {
    constructor(private socketService: SocketService) { }

    // Connect to the chat namespace
    connect(): void {
        this.socketService.connect('chat');
    }

    // Disconnect from the chat namespace
    disconnect(): void {
        this.socketService.disconnect('chat');
    }

    // Join a specific chat room
    joinRoom(roomId: string): void {
        const socket = this.socketService.getSocket('chat');
        if (socket) {
            socket.emit('joinRoom', roomId);
        }
    }

    // Send a chat message
    sendMessage(content: string): void {
        const socket = this.socketService.getSocket('chat');
        if (socket) {
            socket.emit('sendMessage', { content });
        }
    }

    // Listen for new messages
    onMessageReceived(): Observable<any> {
        const socket = this.socketService.getSocket('chat');
        return new Observable((observer) => {
            if (socket) {
                socket.on('receiveMessage', (message) => {
                    observer.next(message);
                });
            }
        });
    }

    // Load chat history
    loadChatHistory(): Observable<any> {
        const socket = this.socketService.getSocket('chat');
        return new Observable((observer) => {
            if (socket) {
                socket.on('loadChatHistory', (messages) => {
                    observer.next(messages);
                });
            }
        });
    }
}
