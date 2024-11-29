import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Board, BoardDocument } from './schemas/board.schema';
import { Tile, TileDocument } from './schemas/tile.schema';
@Injectable()
export class BoardService {
  constructor(
    @InjectModel(Board.name) private readonly boardModel: Model<BoardDocument>,
    @InjectModel(Tile.name) private readonly tileModel: Model<TileDocument>,
  ) {}

  // 1. Initialize a new board for a game
  async initializeBoard(
    gameId: string,
    boardSize: number = 15,
  ): Promise<Board> {
    const boardState = {};

    for (let row = 0; row < boardSize; row++) {
      for (let col = 0; col < boardSize; col++) {
        boardState[`${row},${col}`] = null; // Initialize all positions as empty
      }
    }

    const newBoard = new this.boardModel({
      gameId,
      boardState,
      boardSize,
      remainingTiles: [],
    });

    return newBoard.save();
  }

  async InitializeTiles(boardId: string): Promise<void> {
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

    const tilesToInsert = [];
    for (const tile of tileDistribution) {
      for (let i = 0; i < tile.count; i++) {
        tilesToInsert.push({
          boardId,
          row: null, // Unassigned until placed on the board
          col: null,
          letter: tile.letter,
          pointValue: tile.pointValue,
          isLocked: false,
        });
      }
    }
    await this.tileModel.insertMany(tilesToInsert);
  }
  
  async getTileById(tileId: string): Promise<Tile> {
    const tile = await this.tileModel.findById(tileId).exec();
    if (!tile) {
      throw new NotFoundException('Tile not found');
    }
    return tile;
  }

  // 2. Place a tile on the board (during a move)
  async placeTile(
    boardId: string,
    row: number,
    col: number,
    tileId: string,
  ): Promise<void> {
    const boardTile = await this.tileModel.findOne({ boardId, row, col });

    if (boardTile && boardTile.isLocked) {
      throw new BadRequestException('Tile is locked and cannot be replaced.');
    }

    // Place or update the tile at the specified position
    await this.tileModel.updateOne(
      { boardId, row, col },
      { tileId, isLocked: false },
      { upsert: true }, // Create if not exists
    );
  }

  // 3. Lock tiles after a move is finalized
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

  // 4. Get the current state of the board
  async getBoardState(gameId: string): Promise<Board | null> {
    return this.boardModel
      .findOne({ gameId })
      .populate('remainingTiles')
      .exec();
  }

  // 5. Reset the board for a game
  async resetBoard(gameId: string): Promise<void> {
    await this.boardModel.deleteOne({ gameId });
    await this.tileModel.deleteMany({ boardId: gameId });
  }
}
