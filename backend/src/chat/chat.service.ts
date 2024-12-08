// src/chat/chat.service.ts
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Message, MessageDocument } from './schemas/message.schema';

@Injectable()
export class ChatService {
  constructor(@InjectModel(Message.name) private messageModel: Model<MessageDocument>) {}

  // Save a new message in the database
  async saveMessage(
    sender: string, 
    recipient: string | null, 
    content: string, 
    roomId: string
  ): Promise<Message> {
    const message = new this.messageModel({
      sender,
      recipient,
      content,
      roomId,
      timestamp: new Date(),
    });
  
    return await message.save();
  }

  async getMessagesBetweenUsers(
    user1: string, 
    user2: string | null, 
    roomId: string
  ): Promise<Message[]> {
    const query = {
      roomId,
      $or: [
        { sender: user1, recipient: user2 },
        { sender: user2, recipient: user1 }
      ]
    };
  
    return await this.messageModel
      .find(query)
      .sort({ timestamp: 1 })
      .populate('sender', 'username') // Populate sender username
      .populate('recipient', 'username') // Populate recipient username
      .exec();
  }

  async populateMessage(messageId: string): Promise<Message> {
    return await this.messageModel
      .findById(messageId)
      .populate('sender', 'username')
      .populate('recipient', 'username')
      .exec();
  }

  async populateMessages(messages: Message[]): Promise<Message[]> {
    return Promise.all(
      messages.map((message) =>
        this.messageModel
          .findById(message._id)
          .populate('sender', 'username')
          .populate('recipient', 'username')
          .exec()
      )
    );
  }
}
