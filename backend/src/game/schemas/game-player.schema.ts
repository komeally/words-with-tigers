import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { Game, GameDocument } from './game.schema';
import { User, UserDocument } from 'src/users/schemas/user.schema';
import { Tile } from 'src/board/schemas/tile.schema';

export type GamePlayerDocument = HydratedDocument<GamePlayer>;

@Schema({ timestamps: true })
export class GamePlayer {
  @Prop({ type: Types.ObjectId, ref: 'Game', required: true, index: true })
  gameId: Types.ObjectId | GameDocument; // Reference to the Game

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId | UserDocument; // Reference to the User

  @Prop({ type: Number, default: 0 })
  score: number; // Player's current score

  @Prop({ type: [Types.ObjectId], ref: 'Tile', default: [] })
  currentRack: Tile[]; // Tiles on the player's rack

  @Prop({ type: Boolean, default: false })
  isActive: boolean; // Whether it's the player's turn

  @Prop({ type: Boolean, default: true })
  isConnected: boolean; // Whether the player is online

  @Prop({ type: Date, default: null })
  lastMoveTime: Date; // Timestamp of the last move
}

export const GamePlayerSchema = SchemaFactory.createForClass(GamePlayer);

// Index for finding players in a specific game or games involving a specific user
GamePlayerSchema.index({ gameId: 1, userId: 1 });
