import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  BadRequestException,
} from '@nestjs/common';
import { GameService } from './game.service';

@Controller('games')
export class GameController {
  constructor(private readonly gameService: GameService) {}

  // Retrieve game details
  @Get(':gameId')
  async getGame(@Param('gameId') gameId: string) {
    return this.gameService.findById(gameId);
  }

  // End the game
  @Patch(':gameId/end')
  async endGame(@Param('gameId') gameId: string) {
    await this.gameService.finalizeGame(gameId); // Use finalizeGame to ensure complete processing
    return { message: 'Game finalized successfully' };
  }

  // Initialize a new game
  @Post('start')
  async initializeGame(
    @Body() initializeDto: { createdBy: string; playerIds: string[] },
  ) {
    const { createdBy, playerIds } = initializeDto;
    if (!createdBy || !playerIds || playerIds.length < 2) {
      throw new BadRequestException(
        'At least two players are required to start a game.',
      );
    }
    return this.gameService.initializeGame(createdBy, playerIds);
  }

  @Get(':gameId/players/:playerId?')
  async getPlayer(
    @Param('gameId') gameId: string,
    @Param('playerId') playerId?: string,
  ) {
    return playerId
      ? this.gameService.getPlayer(gameId, playerId)
      : this.gameService.getPlayers(gameId);
  }

  @Get(':gameId/state')
  async getGameState(@Param('gameId') gameId: string) {
    return this.gameService.getGameState(gameId);
  }

  // Create a new move (process a player's turn)
  @Post(':gameId/move')
  async processTurn(
    @Param('gameId') gameId: string,
    @Body()
    turnDto: {
      playerId: string;
      moveType: 'PLACE' | 'PASS' | 'RESIGN';
      word?: string;
      tiles?: { row: number; col: number; letter: string }[];
    },
  ) {
    return this.gameService.processTurn({ gameId, ...turnDto });
  }

  // Get all moves for a game
  @Get(':gameId/moves')
  async getMoves(@Param('gameId') gameId: string) {
    return this.gameService.getGameMoves(gameId);
  }
}
