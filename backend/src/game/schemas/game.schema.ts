import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { User } from 'src/users/schemas/user.schema';
import { Move } from 'src/moves/schemas/move.schema'; // Import Move schema

export type GameDocument = HydratedDocument<Game>;

export enum GameStatus {
  WAITING = 'WAITING',
  IN_PROGRESS = 'IN_PROGRESS',
  FINISHED = 'FINISHED',
  ABANDONED = 'ABANDONED',
}

@Schema({ timestamps: true })
export class Game {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  createdBy: Types.ObjectId | User;

  @Prop({ type: Date, default: null })
  startTime: Date;

  @Prop({ type: Date, default: null })
  endTime: Date;

  @Prop({
    type: String,
    enum: Object.values(GameStatus),
    default: GameStatus.WAITING,
    index: true,
  })
  status: GameStatus;

  @Prop({ type: Number, default: 0 })
  finalScore: number;

  // Add the moves array here
  @Prop({ type: [Types.ObjectId], ref: 'Move', default: [] })
  moves: Types.ObjectId[] | Move[]; // Array of move references
}

export const GameSchema = SchemaFactory.createForClass(Game);

// Index for filtering games by status and creator
GameSchema.index({ status: 1, createdBy: 1 });