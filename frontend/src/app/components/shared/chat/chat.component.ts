import { Component, OnDestroy, OnInit } from '@angular/core';
import { ButtonComponent } from '../button/button.component';
import { ChatService, ChatMessage } from '../../../services/chat.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [ButtonComponent, CommonModule, FormsModule],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.scss',
})
export class ChatComponent implements OnInit, OnDestroy {
  messageContent: string = '';
  messages: ChatMessage[] = []; // Store chat messages
  socketUser: { userId: string; username: string } | null = null; // Store the Socket user

  constructor(private chatService: ChatService) {}

  ngOnInit(): void {
    // Connect to chat service and join the lobby room
    this.chatService.connect();
    this.chatService.joinRoom('lobby');

    // Subscribe to messages stream
    this.chatService.messages$.subscribe((messages) => {
      this.messages = messages;
    });

    // Subscribe to Socket user stream
    this.chatService.socketUser$.subscribe((socketUser) => {
      this.socketUser = socketUser;
    });
  }

  sendMessage(): void {
    if (this.messageContent.trim()) {
      this.chatService.sendMessage(this.messageContent);
      this.messageContent = ''; // Clear the input after sending the message
    }
  }

  issocketUser(userId: string): boolean {
    return this.socketUser?.userId === userId;
  }

  ngOnDestroy(): void {
    // Disconnect from chat service when the component is destroyed
    this.chatService.disconnect();
  }
}
