import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { User } from 'src/users/schemas/user.schema';

export type GameDocument = HydratedDocument<Game>;

// Enum for game statuses
export enum GameStatus {
  WAITING = 'WAITING',
  IN_PROGRESS = 'IN_PROGRESS',
  FINISHED = 'FINISHED',
  ABANDONED = 'ABANDONED',
}

@Schema({ timestamps: true })
export class Game {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  createdBy: Types.ObjectId | User; // Creator of the game

  @Prop({ type: Date, default: null })
  startTime: Date; // When the game started

  @Prop({ type: Date, default: null })
  endTime: Date; // When the game ended

  @Prop({
    type: String,
    enum: Object.values(GameStatus),
    default: GameStatus.WAITING,
    index: true,
  })
  status: GameStatus; // Current status of the game

  @Prop({ type: Number, default: 0 })
  finalScore: number; // Total score for the game
}

export const GameSchema = SchemaFactory.createForClass(Game);

// Index for filtering games by status and creator
GameSchema.index({ status: 1, createdBy: 1 });