import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Tile, TileSchema } from './schemas/tile.schema';
import { TilesService } from './tiles.service';
import { TilesController } from './tiles.controller';

@Module({
  imports: [MongooseModule.forFeature([{ name: Tile.name, schema: TileSchema }])],
  providers: [TilesService],
  exports: [TilesService],
  controllers: [TilesController],
})
export class TilesModule {}