import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { Board } from './board.schema';

export type TileDocument = HydratedDocument<Tile>;

@Schema()
export class Tile {
  @Prop({ type: String, required: true })
  letter: string;

  @Prop({ type: Number, required: true })
  pointValue: number;

  @Prop({ type: Types.ObjectId, ref: 'Board', required: true })
  boardId: Types.ObjectId;

  @Prop({ type: Number, required: true }) // Position on the board
  row: number;

  @Prop({ type: Number, required: true }) // Position on the board
  col: number;

  @Prop({ default: false })
  isLocked: boolean;
}

export const TileSchema = SchemaFactory.createForClass(Tile);
TileSchema.index({ boardId: 1, row: 1, col: 1 }, { unique: true });