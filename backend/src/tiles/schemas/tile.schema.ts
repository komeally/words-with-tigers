import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type TileDocument = HydratedDocument<Tile>;

@Schema()
export class Tile {
  @Prop({ required: true })
  letter: string; // Letter on the tile

  @Prop({ required: true })
  pointValue: number; // Points associated with the tile
}

export const TileSchema = SchemaFactory.createForClass(Tile);