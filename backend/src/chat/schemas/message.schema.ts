import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type MessageDocument = HydratedDocument<Message>;

@Schema({ timestamps: true }) // Enables createdAt and updatedAt timestamps automatically
export class Message {
  @Prop({ required: true })
  sender: string;

  @Prop({ required: false })
  recipient: string;  // This could be left empty for room-wide messages

  @Prop({ required: true })
  content: string;

  @Prop({ required: true })
  roomId: string;  // New field to distinguish between lobby and game-specific chats

  @Prop({ default: Date.now })
  timestamp: Date;
}

export const MessageSchema = SchemaFactory.createForClass(Message);

// Index the roomId, sender, recipient, and timestamp fields for optimized querying
MessageSchema.index({ roomId: 1, sender: 1, recipient: 1, timestamp: 1 });