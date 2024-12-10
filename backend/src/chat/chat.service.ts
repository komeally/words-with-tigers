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
    recipients: string[], 
    content: string, 
    roomId: string
  ): Promise<Message> {
    const message = new this.messageModel({
      sender,
      recipients,
      content,
      roomId,
      timestamp: new Date(),
    });
  
    return await message.save();
  }

  async getMessages(roomId: string): Promise<Message[]> {
    return this.messageModel
      .find({ roomId })
      .sort({ timestamp: 1 })
      .populate('sender', 'username') // Populate sender username
      .populate('recipients', 'username') // Populate recipients usernames
      .exec();
  }

  async populateMessage(messageId: string): Promise<Message> {
    return await this.messageModel
      .findById(messageId)
      .populate('sender', 'username') // Populate sender's username
      .populate({
        path: 'recipients',
        select: 'username', // Populate recipient usernames
      })
      .exec();
  }
  
  async populateMessages(messages: Message[]): Promise<Message[]> {
    return Promise.all(
      messages.map((message) =>
        this.messageModel
          .findById(message._id) // Use the explicitly declared _id property
          .populate('sender', 'username') // Populate sender's username
          .populate({
            path: 'recipients',
            select: 'username', // Populate recipient usernames
          })
          .exec()
      )
    );
  }

  async deleteChatRoom(roomId: string): Promise<void> {
    await this.messageModel.deleteMany({ roomId });
    console.log(`Chat room ${roomId} and its messages have been deleted.`);
  }
}
