import { Module } from '@nestjs/common';
import { BoardService } from './board.service';
import { BoardController } from './board.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Board, BoardSchema } from './schemas/board.schema';
import { Tile, TileSchema } from './schemas/tile.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Board.name, schema: BoardSchema },
      { name: Tile.name, schema: TileSchema },
    ]),
  ],
  providers: [BoardService],
  controllers: [BoardController],
  exports: [BoardService],
})
export class BoardModule {}
