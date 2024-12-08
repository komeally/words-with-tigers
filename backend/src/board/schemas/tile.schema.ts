import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { Board } from './board.schema';

export type TileDocument = HydratedDocument<Tile>;

@Schema()
export class Tile {
  @Prop({ type: Types.ObjectId, ref: 'Board', required: true })
  boardId: Types.ObjectId | Board; // Link to the board

  @Prop({ required: true, min: 0 })
  row: number; // Row position of the tile on the board

  @Prop({ required: true, min: 0 })
  col: number; // Column position of the tile on the board

  @Prop({ required: false })
  letter?: string; // The letter assigned to the tile (if any)

  @Prop({ required: false })
  pointValue?: number; // The point value of the letter tile (if any)

  @Prop({ type: String, enum: ['START', 'DW', 'TW', 'DL', 'TL', 'NONE'], default: 'NONE' })
  specialType: 'START' | 'DW' | 'TW' | 'DL' | 'TL' | 'NONE'; // Type of the tile (starting tile, bonus spaces, etc.)

  @Prop({ type: Boolean, default: false })
  isLocked: boolean; // Indicates if the tile is finalized (e.g., after a word is placed)

  @Prop({ type: Boolean, default: false })
  isOccupied: boolean; // Indicates if a tile is occupied by a letter
}

export const TileSchema = SchemaFactory.createForClass(Tile);
TileSchema.index({ boardId: 1, row: 1, col: 1 }, { unique: true });