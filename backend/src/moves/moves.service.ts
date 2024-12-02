import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Move, MoveDocument } from './schemas/move.schema';
import axios from 'axios';
import { BoardService } from 'src/board/board.service';
import { Tile } from 'src/board/schemas/tile.schema';

@Injectable()
export class MovesService {
  constructor(
    @InjectModel(Move.name) private readonly moveModel: Model<MoveDocument>,
    private readonly boardService: BoardService,
  ) {}

  async getMoves(
    gameId: string,
    options?: { limit?: number; sortOrder?: 'asc' | 'desc' },
  ): Promise<Move[]> {
    const query = { gameId };
    const sortDirection = options?.sortOrder === 'asc' ? 1 : -1;
  
    const moveQuery = this.moveModel
      .find(query)
      .sort({ moveNumber: sortDirection })
      .populate('playerId', 'userId score') // Populate player details
      .populate('tiles', 'letter pointValue'); // Populate tile details
  
    // Apply a limit if specified
    if (options?.limit) {
      moveQuery.limit(options.limit);
    }
  
    return moveQuery.exec();
  }
  
  async placeMove(
    gameId: string,
    playerId: string,
    word: string,
    tiles: Tile[],
    moveCount: number,
  ): Promise<Move> {
    // Validate the word using the dictionary API
    const isWordValid = await this.validateWord(word);
    if (!isWordValid) throw new BadRequestException('Invalid word');

    // Calculate the score for the tiles used in this move
    const score = tiles.reduce((sum, tile) => sum + tile.pointValue, 0);
    if (score === null)
      throw new BadRequestException('Score calculation failed');

    const move = new this.moveModel({
      gameId,
      playerId,
      moveType: 'PLACE',
      word,
      score,
      tiles,
      moveNumber: moveCount + 1,
    });

    return move.save();
  }

  async passOrResignMove(
    gameId: string,
    playerId: string,
    moveType: 'PASS' | 'RESIGN',
    moveCount: number,
  ): Promise<Move> {
    const move = new this.moveModel({
      gameId,
      playerId,
      moveType,
      moveNumber: moveCount + 1,
    });

    return move.save();
  }

  async validateWord(word: string): Promise<boolean> {
    try {
      const response = await axios.get(
        `https://api.dictionaryapi.dev/api/v2/entries/en/${word}`,
      );
      return response.status === 200 && response.data.length > 0;
    } catch (error) {
      return false;
    }
  }
}
