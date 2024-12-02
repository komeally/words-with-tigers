import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Game, GameDocument, GameStatus } from './schemas/game.schema';
import { GamePlayer, GamePlayerDocument } from './schemas/game-player.schema';
import { Move } from 'src/moves/schemas/move.schema';
import { BoardService } from 'src/board/board.service';
import { MovesService } from 'src/moves/moves.service';
import { Tile } from 'src/board/schemas/tile.schema';
import { BoardDocument } from 'src/board/schemas/board.schema';

export enum GameEndReason {
  NATURAL_WINNER = 'NATURAL_WINNER',
  TIE = 'TIE',
  RESIGNATION = 'RESIGNATION',
}

@Injectable()
export class GameService {
  constructor(
    @InjectModel(Game.name) private gameModel: Model<GameDocument>,
    @InjectModel(GamePlayer.name)
    private gamePlayerModel: Model<GamePlayerDocument>,
    private readonly movesService: MovesService,
    private readonly boardService: BoardService,
  ) {}

  // Retrieve a game by its ID
  async findById(gameId: string): Promise<GameDocument> {
    const game = await this.gameModel.findById(gameId).exec();
    if (!game) {
      throw new NotFoundException(`Game with ID ${gameId} not found.`);
    }
    return game;
  }

  // Retrieve a fully populated player in the game by gameId and playerId
  async getPlayer(gameId: string, playerId: string): Promise<GamePlayer> {
    const player = await this.gamePlayerModel
      .findOne({
        gameId: new Types.ObjectId(gameId),
        userId: new Types.ObjectId(playerId),
      })
      .populate('userId') // Populate the user details
      .populate('currentRack') // Populate the player's tiles
      .exec();

    if (!player) {
      throw new NotFoundException(
        `Player with ID ${playerId} not found in game ${gameId}.`,
      );
    }
    return player;
  }

  // Retrieve all players in the game as fully populated documents
  async getPlayers(gameId: string): Promise<GamePlayer[]> {
    // Validate the game existence
    const gameExists = await this.gameModel.exists({ _id: gameId });
    if (!gameExists) {
      throw new NotFoundException(`Game with ID ${gameId} not found.`);
    }

    // Fetch players linked to the game and populate their references
    return await this.gamePlayerModel
      .find({ gameId })
      .populate('userId') // Populate the user details
      .populate('currentRack') // Populate the player's tiles
      .exec();
  }

  async getGameState(gameId: string): Promise<GameDocument> {
    const game = await this.gameModel
      .findById(gameId)
      .populate({
        path: 'boardId',
        select: 'boardState tileBag boardSize lastUpdateTime', // Include boardState and related fields
        populate: {
          path: 'tileBag', // Optionally populate tiles in the bag if needed
        },
      })
      .populate('moves') // Populate move history
      .populate('players') // Populate players with their current racks and scores
      .exec();

    if (!game) {
      throw new NotFoundException(`Game with ID ${gameId} not found.`);
    }

    return game;
  }

  async getGameMoves(gameId: string): Promise<Move[]> {
    return this.movesService.getMoves(gameId);
  }

  async initializeGame(createdBy: string, playerIds: string[]): Promise<Game> {
    // Validate player IDs
    const uniquePlayerIds = [...new Set(playerIds)];
    if (uniquePlayerIds.length < 2) {
      throw new BadRequestException(
        'At least two players are required to start a game.',
      );
    }

    // Create the game
    const newGame = new this.gameModel({ createdBy });
    await newGame.save();

    // Initialize the board
    const board = await this.boardService.initializeBoard(
      newGame._id.toString(),
    );
    newGame.boardId = board._id;

    // Create players and initialize their racks
    for (const playerId of uniquePlayerIds) {
      await this.gamePlayerModel.create({
        gameId: newGame._id,
        userId: playerId,
        currentRack: [],
        isActive: playerId === createdBy, // Set creator as the first active player
      });

      // Allocate initial tiles to the player
      await this.allocateTiles(newGame._id.toString(), playerId, 7);
    }

    newGame.status = GameStatus.IN_PROGRESS;

    // Save the game with the updated board ID
    await newGame.save();
    return newGame;
  }

  // Add a move to the game
  private async addMove(gameId: string, move: Move): Promise<void> {
    await this.gameModel
      .updateOne({ _id: gameId }, { $push: { moves: move } })
      .exec();
  }

  async markPlayerDisconnected(
    gameId: string,
    playerId: string,
  ): Promise<void> {
    const result = await this.gamePlayerModel.findOneAndUpdate(
      {
        gameId: new Types.ObjectId(gameId),
        userId: new Types.ObjectId(playerId),
      },
      { isConnected: false }, // Update the `isConnected` field
      { new: true }, // Return the updated document
    );

    if (!result) {
      throw new NotFoundException(
        `Player with ID ${playerId} not found in game ${gameId}`,
      );
    }
  }

  private async isGameEnded(gameId: string): Promise<boolean> {
    const game = await this.gameModel.findById(gameId).exec();
    if (!game) throw new NotFoundException('Game not found');
    return game.status !== 'IN_PROGRESS';
  }

  private async switchTurns(gameId: string): Promise<string> {
    const game = await this.findById(gameId);
    if (!game) throw new NotFoundException(`Game with ID ${gameId} not found`);

    if (!game.players || game.players.length === 0) {
      throw new NotFoundException(`No players found for game ${gameId}.`);
    }

    // Update the turn index (circular increment)
    game.currentTurnIndex = (game.currentTurnIndex + 1) % game.players.length;

    // Save the updated game state
    await game.save();

    // Retrieve the next player's ID for return
    const nextPlayerId = game.players[game.currentTurnIndex].toString();

    // Update the GamePlayer `isActive` status
    const players = await this.gamePlayerModel.find({
      _id: { $in: game.players },
    });

    for (const player of players) {
      player.isActive = player._id.toString() === nextPlayerId;
      await player.save();
    }

    return nextPlayerId;
  }

  private async allocateTiles(
    gameId: string,
    playerId: string,
    count: number,
  ): Promise<Tile[]> {
    // Call the BoardService to draw tiles from the tile bag
    const drawnTiles = await this.boardService.drawTiles(gameId, count);

    // Retrieve the player's rack
    const player = await this.gamePlayerModel.findOne({
      gameId,
      userId: playerId,
    });
    if (!player) throw new NotFoundException('Player not found.');

    // Ensure the player's rack doesn't exceed the maximum allowed tiles (e.g., 7)
    if (player.currentRack.length + drawnTiles.length > 7) {
      throw new BadRequestException('Cannot exceed the maximum rack size.');
    }

    // Add the drawn tiles to the player's rack
    player.currentRack.push(...drawnTiles);

    // Save the updated player state
    await player.save();

    // Return the drawn tiles
    return drawnTiles;
  }

  private async createMove(moveDto: {
    gameId: string;
    playerId: string;
    moveType: 'PLACE' | 'PASS' | 'RESIGN';
    moveCount: number;
    word?: string;
    tiles?: string[];
  }): Promise<Move> {
    const { gameId, playerId, moveType, moveCount, word, tiles } = moveDto;
    let move: Move;

    if (moveType === 'PLACE') {
      const placedTiles = await this.boardService.getTilesFromIds(tiles);
      move = await this.movesService.placeMove(
        gameId,
        playerId,
        word,
        placedTiles,
        moveCount,
      );
    } else if (moveType === 'PASS' || moveType === 'RESIGN') {
      move = await this.movesService.passOrResignMove(
        gameId,
        playerId,
        moveType,
        moveCount,
      );
    } else {
      throw new BadRequestException('Invalid move type');
    }

    await this.addMove(gameId, move);
    return move;
  }

  async processTurn(turnDto: {
    gameId: string;
    playerId: string;
    moveType: 'PLACE' | 'PASS' | 'RESIGN';
    tiles?: { row: number; col: number; letter: string }[];
    word?: string;
  }): Promise<{ move: Move; tilesDrawn: Tile[] }> {
    const { gameId, playerId, moveType, tiles, word } = turnDto;

    // Fetch the game with populated board and players
    const game = await this.gameModel
      .findById(gameId)
      .populate('boardId') // Populate the board
      .populate('players') // Populate players
      .exec();

    if (!game) throw new BadRequestException('Game not found');
    if (game.status !== 'IN_PROGRESS')
      throw new Error('Game has already ended');

    // Find the current player directly from the populated players array
    const gamePlayer = game.players.find(
      (p) => p.userId.toString() === playerId,
    );
    if (!gamePlayer)
      throw new BadRequestException('Player not part of this game');
    if (!gamePlayer.isActive)
      throw new BadRequestException("It's not your turn");

    let tilesWithIds = [];
    let tilesDrawn: Tile[] = [];

    // Handle tile placement if it's a PLACE move
    if (moveType === 'PLACE') {
      if (!tiles || tiles.length === 0 || !word) {
        throw new BadRequestException(
          'Tiles and word must be provided for PLACE moves',
        );
      }

      // Use the populated board object directly
      const board = game.boardId as BoardDocument;

      // Map tiles with `letter` to include `tileId`
      const tilesWithIds = await Promise.all(
        tiles.map(async (tile) => {
          const tileId = await this.boardService.getTileId(
            board._id.toString(),
            tile.row,
            tile.col,
            tile.letter,
          );
          return { ...tile, tileId };
        }),
      );

      // Place tiles on the board
      await this.boardService.placeTiles(board._id.toString(), tilesWithIds);
    }

    // Create and finalize the move
    const moveCount = game.moves.length;
    const move = await this.createMove({
      gameId,
      playerId,
      moveType,
      word,
      moveCount,
      tiles: tilesWithIds?.map((tile) => tile.tileId),
    });

    if (moveType === 'RESIGN') {
      await this.finalizeGame(gameId); // Ends the game immediately
    }

    // Lock the tiles on the board
    const board = game.boardId as BoardDocument;
    await this.boardService.lockTiles(board._id.toString(), tiles);

    // Check if game has ended after locking tiles
    if (await this.isGameEnded(gameId)) return;

    // Draw new tiles for the player
    const rackSize = 7;
    const tilesToDraw = rackSize - gamePlayer.currentRack.length;
    if (tilesToDraw > 0) {
      tilesDrawn = await this.allocateTiles(gameId, playerId, tilesToDraw);
    }

    // Check for game-ending conditions
    await this.checkEndConditions(gameId);

    // Check if game has ended after checking conditions
    if (await this.isGameEnded(gameId)) return;

    // Switch turns and return the move
    await this.switchTurns(gameId);
    return { move, tilesDrawn };
  }

  private async checkEndConditions(gameId: string): Promise<void> {
    const game = await this.findById(gameId);
    if (!game) throw new NotFoundException('Game not found.');
    const players = game.players;

    // Check for consecutive passes
    const lastMoves = await this.movesService.getMoves(gameId, {
      limit: players.length,
      sortOrder: 'desc',
    });
    if (lastMoves.every((move) => move.moveType === 'PASS')) {
      await this.finalizeGame(gameId);
      return;
    }

    // Check for tile bag empty and racks empty
    const board = await this.boardService.getBoardByGameId(gameId);
    const areRacksEmpty = players.every(
      (player) => player.currentRack.length === 0,
    );

    if (board.tileBag.length === 0 && areRacksEmpty) {
      await this.finalizeGame(gameId);
    }
  }

  // End the game and update status
  private async endGame(gameId: string): Promise<void> {
    await this.gameModel
      .updateOne({ _id: gameId }, { status: 'FINISHED', endTime: new Date() })
      .exec();
  }

  private async finalizeScores(gameId: string): Promise<void> {
    const gamePlayers = await this.gamePlayerModel.find({ gameId }).exec();

    // Calculate and save final scores (no penalties or bonuses)
    for (const player of gamePlayers) {
      await player.save();
    }

    // Determine the winner based on final scores
    const sortedPlayers = gamePlayers.sort((a, b) => b.score - a.score);
    const highestScorer = sortedPlayers[0];
    const highestScore = highestScorer.score;

    // Handle ties
    const winners = sortedPlayers.filter(
      (player) => player.score === highestScore,
    );

    // If there's a single winner, update the game with the winner's ID
    if (winners.length === 1) {
      await this.gameModel
        .updateOne({ _id: gameId }, { winner: highestScorer._id })
        .exec();
    }

    // If there's a tie, winner remains null (you can customize this logic if needed)
  }

  async finalizeGame(gameId: string): Promise<GameEndReason> {
    const game = await this.findById(gameId);
    if (!game) throw new NotFoundException('Game not found.');

    const players = await this.getPlayers(gameId);
    if (!players || players.length === 0) {
      throw new NotFoundException('No players found for this game.');
    }

    // Finalize player scores
    await this.finalizeScores(gameId);

    let endReason: GameEndReason;

    // Check if the last move was a resignation
    const lastMoves = await this.movesService.getMoves(gameId, {
      limit: players.length,
      sortOrder: 'desc',
    });
    if (lastMoves[0]?.moveType === 'RESIGN') {
      endReason = GameEndReason.RESIGNATION;
    } else {
      // Handle natural completion or tie
      const sortedPlayers = players.sort((a, b) => b.score - a.score);
      const highestScorer = sortedPlayers[0] as GamePlayerDocument;
      const highestScore = highestScorer.score;

      const winners = sortedPlayers.filter(
        (player) => player.score === highestScore,
      );

      if (winners.length === 1) {
        game.winner = highestScorer._id;
        endReason = GameEndReason.NATURAL_WINNER;
      } else {
        game.winner = null; // Handle ties
        endReason = GameEndReason.TIE;
      }
    }

    // End the game and update its status
    await this.endGame(gameId);

    // Save the updated game state
    await game.save();

    return endReason;
  }
}
