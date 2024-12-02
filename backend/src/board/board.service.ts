import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Board, BoardDocument } from './schemas/board.schema';
import { Tile, TileDocument } from './schemas/tile.schema';
@Injectable()
export class BoardService {
  constructor(
    @InjectModel(Board.name) private readonly boardModel: Model<BoardDocument>,
    @InjectModel(Tile.name) private readonly tileModel: Model<TileDocument>,
  ) {}

  async getTileId(
    boardId: string,
    row: number,
    col: number,
    letter?: string,
  ): Promise<string> {
    const tile = await this.tileModel.findOne({ boardId, row, col }).exec();

    if (!tile) {
      throw new NotFoundException(
        `No tile found at position (${row}, ${col}) on board ${boardId}`,
      );
    }

    if (letter && tile.letter !== letter) {
      throw new BadRequestException(
        `Mismatch: Expected letter ${letter} at position (${row}, ${col}), but found ${tile.letter}`,
      );
    }

    return tile._id.toString();
  }

  async getTilesFromIds(tileIds: string[]): Promise<Tile[]> {
    return this.tileModel.find({ _id: { $in: tileIds } }).exec();
  }

  async initializeBoard(
    gameId: string,
    boardSize: number = 15,
  ): Promise<BoardDocument> {
    const boardState: Record<string, any> = {};

    // Initialize boardState with empty positions
    for (let row = 0; row < boardSize; row++) {
      for (let col = 0; col < boardSize; col++) {
        boardState[`${row},${col}`] = null;
      }
    }

    // Create a new board document
    const newBoard = new this.boardModel({
      gameId,
      boardState,
      boardSize,
      tileBag: [], // Initialize the tileBag as empty
    });

    const savedBoard = await newBoard.save();

    // Tile distribution setup
    const tileDistribution = [
      { letter: 'E', pointValue: 1, count: 13 },
      { letter: 'A', pointValue: 1, count: 9 },
      { letter: 'I', pointValue: 1, count: 8 },
      { letter: 'O', pointValue: 1, count: 8 },
      { letter: 'T', pointValue: 1, count: 7 },
      { letter: 'R', pointValue: 1, count: 6 },
      { letter: 'S', pointValue: 1, count: 5 },
      { letter: 'D', pointValue: 2, count: 5 },
      { letter: 'N', pointValue: 2, count: 5 },
      { letter: 'L', pointValue: 2, count: 4 },
      { letter: 'U', pointValue: 2, count: 4 },
      { letter: 'H', pointValue: 3, count: 4 },
      { letter: 'G', pointValue: 3, count: 3 },
      { letter: 'Y', pointValue: 3, count: 2 },
      { letter: 'B', pointValue: 4, count: 2 },
      { letter: 'C', pointValue: 4, count: 2 },
      { letter: 'F', pointValue: 4, count: 2 },
      { letter: 'M', pointValue: 4, count: 2 },
      { letter: 'P', pointValue: 4, count: 2 },
      { letter: 'W', pointValue: 4, count: 2 },
      { letter: 'V', pointValue: 5, count: 2 },
      { letter: 'K', pointValue: 5, count: 1 },
      { letter: 'X', pointValue: 8, count: 1 },
      { letter: 'J', pointValue: 10, count: 1 },
      { letter: 'Q', pointValue: 10, count: 1 },
      { letter: 'Z', pointValue: 10, count: 1 },
    ];

    // Create tiles and update tileBag
    const tilesToInsert = [];
    for (const tile of tileDistribution) {
      for (let i = 0; i < tile.count; i++) {
        tilesToInsert.push({
          boardId: savedBoard._id,
          row: null, // Unassigned until placed on the board
          col: null,
          letter: tile.letter,
          pointValue: tile.pointValue,
          isLocked: false,
        });
      }
    }

    // Insert tiles into the database
    const insertedTiles = await this.tileModel.insertMany(tilesToInsert);

    // Update the tileBag of the board with the IDs of the inserted tiles
    savedBoard.tileBag = insertedTiles.map((tile) => tile._id);
    await savedBoard.save();

    return savedBoard;
  }

  async updateBoardState(
    boardId: string,
    updates: { row: number; col: number; tileId?: string }[],
  ): Promise<void> {
    const board = await this.boardModel.findById(boardId).exec();
    if (!board) {
      throw new NotFoundException(`Board with ID ${boardId} not found.`);
    }

    const boardState = board.boardState || {}; // Ensure boardState is initialized

    for (const { row, col, tileId } of updates) {
      const positionKey = `${row},${col}`;

      if (!tileId) {
        // Remove the tile from the boardState
        boardState[positionKey] = null;
      } else {
        // Retrieve the tile to update boardState with its letter
        const tile = await this.tileModel.findById(tileId).exec();
        if (!tile) {
          throw new NotFoundException(`Tile with ID ${tileId} not found.`);
        }
        boardState[positionKey] = tile.letter; // Update the boardState with the tile's letter
      }
    }

    // Save the updated boardState and timestamp
    board.boardState = boardState;
    board.lastUpdateTime = new Date();
    await board.save();
  }

  async placeTiles(
    boardId: string,
    tiles: { row: number; col: number; tileId?: string }[],
  ): Promise<void> {
    for (const { row, col, tileId } of tiles) {
      if (!tileId) {
        // Remove the tile if tileId is null or undefined
        await this.tileModel.deleteOne({ boardId, row, col });
      } else {
        const boardTile = await this.tileModel.findOne({ boardId, row, col });
        if (boardTile && boardTile.isLocked) {
          throw new BadRequestException(
            `Tile at row ${row}, col ${col} is locked.`,
          );
        }
        await this.tileModel.updateOne(
          { boardId, row, col },
          { tileId, isLocked: false },
          { upsert: true },
        );
      }
    }

    // Centralized update for boardState
    await this.updateBoardState(boardId, tiles);
  }

  async lockTiles(
    boardId: string,
    tilePositions: { row: number; col: number }[],
  ): Promise<void> {
    await this.tileModel.updateMany(
      {
        boardId,
        $or: tilePositions.map(({ row, col }) => ({ row, col })),
      },
      { isLocked: true },
    );
  }

  async drawTiles(gameId: string, count: number): Promise<Tile[]> {
    // Retrieve the current board by gameId
    const board = await this.boardModel.findOne({ gameId });
    if (!board) throw new NotFoundException('Board not found.');

    // Ensure there are enough tiles left
    if (board.tileBag.length < count) {
      throw new BadRequestException('Not enough tiles remaining.');
    }

    // Shuffle and draw the requested number of tiles
    const drawnTiles = [];
    for (let i = 0; i < count; i++) {
      const randomIndex = Math.floor(Math.random() * board.tileBag.length);
      const [tile] = board.tileBag.splice(randomIndex, 1);
      drawnTiles.push(tile);
    }

    // Save the updated board state
    await board.save();

    // Return the drawn tiles
    return drawnTiles;
  }

  async getBoardByGameId(gameId: string): Promise<Board> {
    const board = await this.boardModel.findOne({ gameId }).exec();
    if (!board) {
      throw new NotFoundException(`Board for game ${gameId} not found.`);
    }
    return board;
  }

  async getBoardState(gameId: string): Promise<Board | null> {
    return this.boardModel.findOne({ gameId }).populate('tileBag').exec();
  }

  async resetBoard(gameId: string): Promise<void> {
    await this.boardModel.deleteOne({ gameId });
    await this.tileModel.deleteMany({ boardId: gameId });
  }
}
