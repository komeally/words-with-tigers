import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Tile, TileDocument } from './schemas/tile.schema';

@Injectable()
export class TilesService {
  constructor(@InjectModel(Tile.name) private tileModel: Model<TileDocument>) {}

  async createTile(letter: string, pointValue: number): Promise<Tile> {
    const tile = new this.tileModel({ letter, pointValue });
    return await tile.save();
  }

  async getTileById(tileId: string) {
    const user = await this.tileModel.findById(tileId).exec();
    if (!user) {
      throw new Error('Tile not found');
    }
    return user;
  }

  async getAllTiles(): Promise<Tile[]> {
    return await this.tileModel.find().exec();
  }

  async resetTileBag(): Promise<void> {
    // Clear any existing tiles in the database
    await this.tileModel.deleteMany({});
  
    // Define the initial tile set
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
  
    // Create the tiles in the database based on the distribution
    const tilesToInsert = [];
    for (const tile of tileDistribution) {
      for (let i = 0; i < tile.count; i++) {
        tilesToInsert.push({
          letter: tile.letter,
          pointValue: tile.pointValue,
        });
      }
    }
    // Insert all tiles into the database
    await this.tileModel.insertMany(tilesToInsert);
  
    console.log('Tile bag has been reset successfully.');
  }  
}