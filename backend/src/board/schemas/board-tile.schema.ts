import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { Board } from './board.schema';
import { Tile } from 'src/tiles/schemas/tile.schema';

export type BoardTileDocument = HydratedDocument<BoardTile>;

@Schema()
export class BoardTile {
  @Prop({ type: Types.ObjectId, ref: 'Board', required: true })
  boardId: Types.ObjectId | Board; // Links this tile to a specific board

  @Prop({ required: true, min: 0 }) // Assume board size validation happens elsewhere
  row: number; // Row position of the tile

  @Prop({ required: true, min: 0 })
  col: number; // Column position of the tile

  @Prop({ type: Types.ObjectId, ref: 'Tile', required: true })
  tileId: Types.ObjectId | Tile; // Links this position to a specific Tile

  @Prop({ default: false })
  isLocked: boolean; // Indicates if the tile is finalized (part of a scored word)
}

export const BoardTileSchema = SchemaFactory.createForClass(BoardTile);

BoardTileSchema.index({ boardId: 1, row: 1, col: 1 }, { unique: true }); // Unique constraint per board position
BoardTileSchema.index({ tileId: 1 }); // Useful if querying by tiles