import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Move, MoveDocument } from './schemas/move.schema';
import axios from 'axios';
import { Tile } from 'src/board/schemas/tile.schema';

@Injectable()
export class MovesService {
  constructor(
    @InjectModel(Move.name) private readonly moveModel: Model<MoveDocument>
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

  private async validateAndScoreWords(
    words: string[],
    wordTiles: { [word: string]: Tile[] },
  ): Promise<{ validWords: string[]; totalScore: number }> {
    const validWords: string[] = [];
    let totalScore = 0;
  
    for (const word of words) {
      const isValid = await this.validateWord(word);
      if (isValid) {
        validWords.push(word);
  
        // Calculate score for the word based on its tiles
        const score = wordTiles[word].reduce((sum, tile) => sum + tile.pointValue, 0);
        totalScore += score;
      }
    }
  
    return { validWords, totalScore };
  }
  
  async placeMove(
    gameId: string,
    playerId: string,
    words: string[],
    tiles: Tile[],
    wordTiles: { [word: string]: Tile[] },
    moveCount: number,
  ): Promise<Move> {
    // Validate and score the words
    const { validWords, totalScore } = await this.validateAndScoreWords(words, wordTiles);
  
    // If any words are invalid, throw an error with details
    if (validWords.length !== words.length) {
      const invalidWords = words.filter((word) => !validWords.includes(word));
      throw new BadRequestException(
        `The following words are invalid: ${invalidWords.join(', ')}`,
      );
    }
  
    // Create a move document with valid words and total score
    const move = new this.moveModel({
      gameId,
      playerId,
      moveType: 'PLACE',
      words: validWords, // Store all valid words
      score: totalScore, // Total score of the move
      tiles: tiles, // Store tiles used in the move
      moveNumber: moveCount + 1, // Increment move count
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

  async deleteMovesByGame(gameId: string): Promise<void> {
    try {
      await this.moveModel.deleteMany({ gameId });
    } catch (error) {
      throw new BadRequestException('Failed to delete moves: ' + error.message);
    }
  }
}
