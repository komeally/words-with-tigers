import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { MovesService } from './moves.service';
import { Move } from './schemas/move.schema';

@Controller('moves')
export class MovesController {
  constructor(private readonly movesService: MovesService) {}

  @Get('game/:gameId')
  async getMovesForGame(@Param('gameId') gameId: string): Promise<Move[]> {
    const moves = await this.movesService.getMovesByGame(gameId);
    if (!moves || moves.length === 0) {
      throw new NotFoundException('No moves found for this game');
    }
    return moves;
  }
}
