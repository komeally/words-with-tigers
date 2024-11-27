import { Module } from '@nestjs/common';
import { MovesService } from './moves.service';
import { MovesController } from './moves.controller';

@Module({
  providers: [MovesService],
  controllers: [MovesController]
})
export class MovesModule {}
