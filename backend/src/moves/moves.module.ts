import { Module } from '@nestjs/common';
import { MovesService } from './moves.service';

@Module({
  providers: [MovesService]
})
export class MovesModule {}
