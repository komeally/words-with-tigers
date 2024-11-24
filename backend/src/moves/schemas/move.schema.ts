import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { GamePlayer } from 'src/game/schemas/game-player.schema';
import { Game } from 'src/game/schemas/game.schema';
import { Tile } from 'src/tiles/schemas/tile.schema';

export type MoveDocument = HydratedDocument<Move>;

@Schema({ versionKey: false })
export class Move {
  @Prop({ type: Types.ObjectId, ref: 'Game', required: true, index: true })
  gameId: Types.ObjectId | Game; // Reference to the Game this move belongs to

  @Prop({ type: Types.ObjectId, ref: 'GamePlayer', required: true, index: true })
  playerId: Types.ObjectId | GamePlayer; // Reference to the player making the move

  @Prop({ type: String, default: null })
  word: string | null; // The word formed (null for PASS or RESIGN moves)

  @Prop({ type: Number, default: null })
  score: number | null; // Points scored for the move (null for PASS or RESIGN)

  @Prop({
    type: [Types.ObjectId],
    ref: 'Tile',
    default: [],
    validate: {
      validator: function (value: Types.ObjectId[]) {
        return this.moveType === 'PLACE' ? value.length > 0 : value.length === 0;
      },
      message: 'Tiles must be provided for PLACE moves and must be empty for PASS/RESIGN moves',
    },
  })
  tiles: Types.ObjectId[] | Tile; // Tiles used for this move (if applicable)

  @Prop({ type: String, enum: ['PLACE', 'PASS', 'RESIGN'], required: true })
  moveType: 'PLACE' | 'PASS' | 'RESIGN'; // The type of move

  @Prop({ type: Number, required: true })
  moveNumber: number; // The sequence number of the move within the game

  @Prop({ type: Date, default: () => new Date() })
  timestamp: Date; // When the move was made
}

export const MoveSchema = SchemaFactory.createForClass(Move);

// Indexes for performance
MoveSchema.index({ gameId: 1, moveNumber: 1 }); // For retrieving moves in sequence for a game
MoveSchema.index({ playerId: 1 }); // To fetch all moves made by a specific player