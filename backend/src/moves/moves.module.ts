import { Module } from '@nestjs/common';
import { MovesService } from './moves.service';
import { Move, MoveSchema } from './schemas/move.schema';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Move.name, schema: MoveSchema }]),
  ],
  providers: [MovesService],
  exports: [MovesService],
})
export class MovesModule {}
