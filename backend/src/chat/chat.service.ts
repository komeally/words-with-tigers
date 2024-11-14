// src/chat/chat.service.ts
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Message, MessageDocument } from './schemas/message.schema';

@Injectable()
export class ChatService {
  constructor(@InjectModel(Message.name) private messageModel: Model<MessageDocument>) {}

  // Save a new message in the database
  async saveMessage(sender: string, recipient: string | null, content: string, roomId: string): Promise<Message> {
    const message = new this.messageModel({
      sender,
      recipient,
      content,
      roomId,
      timestamp: new Date(),
    });
    return message.save();
  }
  
  async getMessagesBetweenUsers(user1: string, user2: string | null, roomId: string): Promise<Message[]> {
    return this.messageModel
      .find({
        roomId,
        $or: [
          { sender: user1, recipient: user2 },
          { sender: user2, recipient: user1 }
        ]
      })
      .sort({ timestamp: 1 })
      .exec();
  }
}
