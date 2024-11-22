import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';
import { User } from 'src/users/schemas/user.schema';

export type MessageDocument = HydratedDocument<Message>;

@Schema({ timestamps: true }) // Enables createdAt and updatedAt timestamps automatically
export class Message {
  _id: string; // Explicitly declare the _id field for TypeScript

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  sender: User; // Reference to the User schema

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: false })
  recipient: User; // Reference to the User schema (optional for room-wide messages)

  @Prop({ required: true })
  content: string;

  @Prop({ required: true })
  roomId: string; // Distinguishes between lobby and game-specific chats

  @Prop({ default: Date.now })
  timestamp: Date;
}

export const MessageSchema = SchemaFactory.createForClass(Message);

// Index the roomId, sender, recipient, and timestamp fields for optimized querying
MessageSchema.index({ roomId: 1, sender: 1, recipient: 1, timestamp: 1 });