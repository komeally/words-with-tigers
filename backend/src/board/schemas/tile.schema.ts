import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { Board } from './board.schema';

export type TileDocument = HydratedDocument<Tile>;

@Schema()
export class Tile {
  @Prop({ type: Types.ObjectId, ref: 'Board', required: true })
  boardId: Types.ObjectId | Board; // Links this tile to a specific board

  @Prop({ required: true, min: 0 })
  row: number; // Row position of the tile

  @Prop({ required: true, min: 0 })
  col: number; // Column position of the tile

  @Prop({ required: true })
  letter: string; // The letter on the tile

  @Prop({ required: true })
  pointValue: number; // The point value of the tile

  @Prop({ default: false })
  isLocked: boolean; // Indicates if the tile is finalized
}

export const BoardTileSchema = SchemaFactory.createForClass(Tile);
BoardTileSchema.index({ boardId: 1, row: 1, col: 1 }, { unique: true });