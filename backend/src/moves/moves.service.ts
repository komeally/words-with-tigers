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

  async createMove(moveDto: {
    gameId: string;
    playerId: string;
    moveType: 'PLACE' | 'PASS' | 'RESIGN';
    word?: string;
    tiles?: string[];
  }): Promise<Move> {
    const { gameId, playerId, moveType, word, tiles } = moveDto;
  
    // Validate the game and player
    const game = await this.gameService.findById(gameId);
    if (!game) throw new BadRequestException('Game not found');
  
    const gamePlayer = await this.gameService.getPlayer(gameId, playerId);
    if (!gamePlayer) throw new BadRequestException('Player not part of this game');
  
    if (!gamePlayer.isActive) throw new BadRequestException("It's not your turn");
  
    let newMove;
  
    // Validate move type
    if (moveType === 'PLACE') {
      if (!word || !tiles || tiles.length === 0) {
        throw new BadRequestException('Word and tiles must be provided for PLACE moves');
      }
  
      // Validate the word with the dictionary API
      const isWordValid = await this.validateWord(word);
      if (!isWordValid) throw new BadRequestException('Invalid word');
  
      // Calculate the score for the move
      const score = await this.calculateScore(tiles);
      if (!score) throw new BadRequestException('Score calculation failed');
  
      // Create the move document
      newMove = new this.moveModel({
        gameId,
        playerId,
        moveType,
        word,
        score,
        tiles,
        moveNumber: game.moves.length + 1, // Use the current count of moves to set the move number
      });
  
    } else if (moveType === 'PASS' || moveType === 'RESIGN') {
      // No word or tiles allowed for PASS/RESIGN
      if (word || tiles?.length) {
        throw new BadRequestException(`${moveType} moves must not include word or tiles`);
      }
  
      newMove = new this.moveModel({
        gameId,
        playerId,
        moveType,
        moveNumber: game.moves.length + 1,
      });
    } else {
      throw new BadRequestException('Invalid move type');
    }
  
    // Save the move
    const savedMove = await newMove.save();
  
    // Add the move to the game
    await this.gameService.addMove(gameId, savedMove._id.toString());
    
    return savedMove;
  }
  
  async getMovesByGame(gameId: string): Promise<Move[]> {
    return this.moveModel.find({ gameId }).sort({ moveNumber: 1 }).exec();
  }

  async getMovesByPlayer(playerId: string): Promise<Move[]> {
    return this.moveModel.find({ playerId }).exec();
  }

  private async validateWord(word: string): Promise<boolean> {
    try {
      const response = await axios.get(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
      return response.status === 200 && response.data.length > 0;
    } catch (error) {
      return false;
    }
  }

  private async calculateScore(tileIds: string[]): Promise<number> {
    const tiles = await Promise.all(tileIds.map(id => this.boardService.getTileById(id)));
    return tiles.reduce((sum, tile) => sum + tile.pointValue, 0);
  }
}
