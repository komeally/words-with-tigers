import { Component, OnDestroy, OnInit } from '@angular/core';
import { ButtonComponent } from '../button/button.component';
import { ChatService } from '../../../services/chat.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [ButtonComponent, CommonModule, FormsModule],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.scss'
})
export class ChatComponent implements OnInit, OnDestroy {
  messageContent: string = '';
  messages: any[] = [];

  constructor(private chatService: ChatService) {}

  ngOnInit(): void {
    this.chatService.connect();
    this.chatService.joinRoom('lobby');

    // Load chat history
    this.chatService.loadChatHistory().subscribe((messages: any[]) => {
      this.messages = messages;
    });

    // Listen for incoming messages
    this.chatService.onMessageReceived().subscribe((message: any) => {
      console.log(message);
      this.messages.push(message);
    });
  }

  sendMessage(): void {
    if (this.messageContent.trim()) {
      this.chatService.sendMessage(this.messageContent);
      this.messageContent = ''; // Clear input
    }
  }

  ngOnDestroy(): void {
    this.chatService.disconnect(); // Cleanup on component destruction
  }
}