import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { User } from 'src/users/schemas/user.schema';
import { Move } from 'src/moves/schemas/move.schema'; // Import Move schema
import { Board } from 'src/board/schemas/board.schema';
import { GamePlayer } from './game-player.schema';

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

  @Prop({ type: Types.ObjectId, ref: 'Board', default: null }) // Link to the board
  boardId: Types.ObjectId | Board;

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

  @Prop({ type: [Types.ObjectId], ref: 'Move', default: [] })
  moves: Move[];
  
  @Prop({ type: [Types.ObjectId], ref: 'GamePlayer', default: [] })
  players: GamePlayer[]; // Ordered list of players in the game
  
  @Prop({ type: Number, default: 0 })
  currentTurnIndex: number; // Index of the current player's turn

  @Prop({ type: Types.ObjectId, ref: 'GamePlayer', default: null })
  winner: Types.ObjectId | GamePlayer;
}

export const GameSchema = SchemaFactory.createForClass(Game);

// Index for filtering games by status and creator
GameSchema.index({ status: 1, createdBy: 1 });