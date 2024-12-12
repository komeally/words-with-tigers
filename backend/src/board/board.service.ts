import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model } from 'mongoose';
import { Board, BoardDocument } from './schemas/board.schema';
import { Tile, TileDocument } from './schemas/tile.schema';
@Injectable()
export class BoardService {
  constructor(
    @InjectModel(Board.name) private readonly boardModel: Model<BoardDocument>,
    @InjectModel(Tile.name) private readonly tileModel: Model<TileDocument>,
    @InjectConnection() private readonly connection: Connection,
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
    try {
      const boardState: Record<string, any> = {};

      // Step 1: Initialize the board state with empty positions
      for (let row = 0; row < boardSize; row++) {
        for (let col = 0; col < boardSize; col++) {
          boardState[`${row},${col}`] = null;
        }
      }

      // Step 2: Populate the tileBag for the board
      const tileDistribution = [
        { letter: 'E', pointValue: 1, count: 13 },
        { letter: 'A', pointValue: 1, count: 9 },
        { letter: 'I', pointValue: 1, count: 8 },
        // Add other letters...
      ];

      const tileBag = [];
      for (const tile of tileDistribution) {
        for (let i = 0; i < tile.count; i++) {
          tileBag.push({ letter: tile.letter, pointValue: tile.pointValue });
        }
      }

      // Step 3: Create and save the board
      const newBoard = new this.boardModel({
        gameId,
        boardState,
        boardSize,
        tileBag, // Embedded tiles
      });

      return await newBoard.save();
    } catch (error) {
      console.error('Error initializing board:', error.stack);
      throw new Error('Failed to initialize board.');
    }
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
        // Retrieve the placed tile to update boardState
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

  private async getWordFromDirection(
    boardId: string,
    row: number,
    col: number,
    direction: 'horizontal' | 'vertical',
  ): Promise<{
    word: string;
    tiles: { row: number; col: number; tileId: string }[];
  }> {
    const board = await this.boardModel
      .findById(boardId)
      .populate('tileBag')
      .exec();
    if (!board) throw new Error('Board not found');

    const tiles = board.boardState; // Assuming `boardState` contains the tile positions.
    let word = '';
    const wordTiles = [];

    // Step in the specified direction (left/up or right/down)
    const deltaRow = direction === 'vertical' ? 1 : 0;
    const deltaCol = direction === 'horizontal' ? 1 : 0;

    // Scan backward to the start of the word
    let currentRow = row;
    let currentCol = col;
    while (
      tiles[`${currentRow},${currentCol}`] &&
      tiles[`${currentRow},${currentCol}`].isLocked
    ) {
      currentRow -= deltaRow;
      currentCol -= deltaCol;
    }

    // Adjust to the first valid tile
    currentRow += deltaRow;
    currentCol += deltaCol;

    // Scan forward to collect the word and tiles
    while (
      tiles[`${currentRow},${currentCol}`] &&
      tiles[`${currentRow},${currentCol}`].isLocked
    ) {
      const tile = tiles[`${currentRow},${currentCol}`];
      word += tile.letter;
      wordTiles.push({ row: currentRow, col: currentCol, tileId: tile.tileId });

      currentRow += deltaRow;
      currentCol += deltaCol;
    }

    return { word, tiles: wordTiles };
  }

  async generateWords(
    boardId: string,
    placedTiles: { row: number; col: number }[],
  ): Promise<string[]> {
    const words = [];

    for (const tile of placedTiles) {
      const horizontalWord = await this.getWordFromDirection(
        boardId,
        tile.row,
        tile.col,
        'horizontal',
      );
      if (horizontalWord.word.length > 1) words.push(horizontalWord);

      const verticalWord = await this.getWordFromDirection(
        boardId,
        tile.row,
        tile.col,
        'vertical',
      );
      if (verticalWord.word.length > 1) words.push(verticalWord);
    }

    return words;
  }

  async placeTiles(
    boardId: string,
    tiles: { row: number; col: number; letter: string; tileId: string }[],
  ): Promise<void> {
    for (const { row, col, letter, tileId } of tiles) {
      // Handle tile placement logic here
      const boardTile = await this.tileModel.findOne({ boardId, row, col });
      if (boardTile && boardTile.isLocked) {
        throw new BadRequestException(
          `Tile at row ${row}, col ${col} is locked.`,
        );
      }

      await this.tileModel.updateOne(
        { boardId, row, col },
        { letter, tileId, isLocked: false },
        { upsert: true },
      );
    }

    await this.updateBoardState(
      boardId,
      tiles.map(({ row, col, letter }) => ({ row, col, letter })),
    );
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
    // Retrieve the board for the game
    const board = await this.boardModel.findOne({ gameId });
    if (!board) throw new NotFoundException('Board not found.');

    // Ensure there are enough tiles in the tile bag
    if (board.tileBag.length < count) {
      throw new BadRequestException('Not enough tiles remaining.');
    }

    // Randomly draw tiles
    const drawnTiles = [];
    for (let i = 0; i < count; i++) {
      const randomIndex = Math.floor(Math.random() * board.tileBag.length);
      const [tile] = board.tileBag.splice(randomIndex, 1); // Remove tile from tileBag
      drawnTiles.push(tile);
    }

    // Update the board's tileBag atomically
    await this.boardModel.findOneAndUpdate(
      { _id: board._id },
      { tileBag: board.tileBag }, // Update with the modified tileBag
      { new: true }, // Return the updated document
    );

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

  async deleteBoard(gameId: string): Promise<void> {
    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      const board = await this.boardModel.findOne({ gameId }).session(session);

      if (!board) {
        throw new Error(`Board associated with game ID ${gameId} not found.`);
      }

      // Delete all tiles associated with the board
      await this.tileModel.deleteMany({ _id: board._id }).session(session);

      // Delete the board itself
      await this.boardModel.deleteOne({ _id: board._id }).session(session);

      await session.commitTransaction();
    } catch (error) {
      await session.abortTransaction();
      throw new BadRequestException('Failed to delete board: ' + error.message);
    } finally {
      session.endSession();
    }
  }
}
