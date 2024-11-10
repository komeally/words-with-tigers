// src/chat/chat.service.ts
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Message, MessageDocument } from './schemas/message.schema';

@Injectable()
export class ChatService {
  constructor(@InjectModel(Message.name) private messageModel: Model<MessageDocument>) {}

  // Save a new message in the database
  async saveMessage(sender: string, recipient: string, content: string): Promise<Message> {
    const message = new this.messageModel({ sender, recipient, content });
    return message.save();
  }

  // Retrieve conversation between two users, ordered by timestamp
  async getMessagesBetweenUsers(user1: string, user2: string): Promise<Message[]> {
    return this.messageModel
      .find({
        $or: [
          { sender: user1, recipient: user2 },
          { sender: user2, recipient: user1 }
        ]
      })
      .sort({ timestamp: 1 })  // Sort by ascending timestamp
      .exec();
  }
}
