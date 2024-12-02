import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Move, MoveDocument } from './schemas/move.schema';
import axios from 'axios';
import { BoardService } from 'src/board/board.service';
import { GameService } from 'src/game/game.service';

@Injectable()
export class MovesService {
  constructor(
    @InjectModel(Move.name) private readonly moveModel: Model<MoveDocument>,
    private readonly gameService: GameService,
    private readonly boardService: BoardService,
  ) {}

  async getMovesByGame(gameId: string): Promise<Move[]> {
    return this.moveModel.find({ gameId }).sort({ moveNumber: 1 }).exec();
  }

  async getMovesByPlayer(playerId: string): Promise<Move[]> {
    return this.moveModel.find({ playerId }).exec();
  }

  async getLastMoves(gameId: string, count: number): Promise<Move[]> {
    return this.moveModel
      .find({ gameId })
      .sort({ moveNumber: -1 }) // Sort in descending order by move number
      .limit(count)
      .exec();
  }
  

  async placeMove(
    gameId: string,
    playerId: string,
    word: string,
    tiles: string[],
    moveCount: number,
  ): Promise<Move> {
    // Validate the word using the dictionary API
    const isWordValid = await this.validateWord(word);
    if (!isWordValid) throw new BadRequestException('Invalid word');

    // Calculate the score for the tiles used in this move
    const score = await this.calculateScore(tiles);
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

  async calculateScore(tileIds: string[]): Promise<number> {
    const tiles = await Promise.all(
      tileIds.map((id) => this.boardService.getTileById(id)),
    );
    return tiles.reduce((sum, tile) => sum + tile.pointValue, 0);
  }
}
