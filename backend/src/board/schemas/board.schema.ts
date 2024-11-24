import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { Tile } from 'src/tiles/schemas/tile.schema';
import { Game } from 'src/game/schemas/game.schema';

export type BoardDocument = HydratedDocument<Board>;

@Schema({ timestamps: true })
export class Board {
  @Prop({ type: Types.ObjectId, ref: 'Game', required: true, index: true })
  gameId: Types.ObjectId | Game; // Links this board to a specific game

  @Prop({ type: Map, of: Object, required: true })
  boardState: Record<string, any>; // JSON-like structure representing the board's current state

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Tile' }], default: [] })
  remainingTiles: Types.ObjectId[] | Tile[]; // Tiles left in the bag

  @Prop({ default: Date.now })
  lastUpdateTime: Date; // Timestamp for the last update to the board

  @Prop({ default: 15})
  boardSize: number; // Dimension of the board (default 15x15)
}

const BoardSchema = SchemaFactory.createForClass(Board);

export { BoardSchema };