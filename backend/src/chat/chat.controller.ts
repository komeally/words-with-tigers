import {
  Controller,
  Get,
  Delete,
  Param,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { Public } from 'src/auth/public.decorator';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Public()
  @Get('room/:roomId')
  async getMessagesFromRoom(@Param('roomId') roomId: string) {
    if (!roomId) {
      throw new BadRequestException('Room ID is required');
    }

    const messages = await this.chatService.getMessages(roomId);
    if (!messages || messages.length === 0) {
      throw new NotFoundException(`No messages found for room ID: ${roomId}`);
    }

    return { roomId, messages };
  }

  @Public()
  @Get('message/:messageId')
  async getMessageById(@Param('messageId') messageId: string) {
    const message = await this.chatService.populateMessage(messageId);
    if (!message) {
      throw new NotFoundException(`Message with ID ${messageId} not found`);
    }
    return message;
  }

  @Public()
  @Delete('room/:roomId')
  async deleteChatRoom(@Param('roomId') roomId: string) {
    if (!roomId) {
      throw new BadRequestException('Room ID is required');
    }

    await this.chatService.deleteChatRoom(roomId);
    return {
      message: `Chat room ${roomId} and its messages have been deleted.`,
    };
  }
}
