import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Tile, TileSchema } from './schemas/tile.schema';
import { TilesService } from './tiles.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: Tile.name, schema: TileSchema }])],
  providers: [TilesService],
  exports: [TilesService],
})
export class TilesModule {}