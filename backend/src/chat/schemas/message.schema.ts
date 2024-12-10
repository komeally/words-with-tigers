import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { User } from 'src/users/schemas/user.schema';

export type MessageDocument = HydratedDocument<Message>;

@Schema({ timestamps: true }) // Enables createdAt and updatedAt timestamps automatically
export class Message {
  _id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  sender: User; // Reference to the User schema

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
  recipients: User[]; // Array of recipients for group messages

  @Prop({ required: true })
  content: string;

  @Prop({ required: true })
  roomId: string; // Distinguishes between lobby and game-specific chats

  @Prop({ default: Date.now })
  timestamp: Date;
}

export const MessageSchema = SchemaFactory.createForClass(Message);

// Index the roomId, sender, recipients, and timestamp fields for optimized querying
MessageSchema.index({ roomId: 1, sender: 1, recipients: 1, timestamp: 1 });
