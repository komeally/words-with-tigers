import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Game, GameDocument } from './schemas/game.schema';
import { GamePlayer, GamePlayerDocument } from './schemas/game-player.schema';

@Injectable()
export class GameService {
  constructor(
    @InjectModel(Game.name) private gameModel: Model<GameDocument>,
    @InjectModel(GamePlayer.name) private gamePlayerModel: Model<GamePlayerDocument>,
  ) {}

  async findById(gameId: string): Promise<Game> {
    const game = await this.gameModel.findById(gameId).exec();
    if (!game) {
      throw new NotFoundException(`Game with ID ${gameId} not found.`);
    }
    return game;
  }

  async getPlayer(gameId: string, playerId: string): Promise<GamePlayer> {
    const player = await this.gamePlayerModel.findOne({
      gameId: new Types.ObjectId(gameId),
      userId: new Types.ObjectId(playerId),
    }).exec();

    if (!player) {
      throw new NotFoundException(
        `Player with ID ${playerId} not found in game ${gameId}.`,
      );
    }
    return player;
  }

  async addMove(gameId: string, moveId: string): Promise<void> {
    await this.gameModel.updateOne(
      { _id: gameId },
      { $push: { moves: moveId } }
    ).exec();
  }
}