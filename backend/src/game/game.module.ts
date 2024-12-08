import { Module } from '@nestjs/common';
import { GameService } from './game.service';
import { GameController } from './game.controller';
import { GameGateway } from './game.gateway';
import { MongooseModule } from '@nestjs/mongoose';
import { Game, GameSchema } from './schemas/game.schema';
import { GamePlayer, GamePlayerSchema } from './schemas/game-player.schema';
import { MovesModule } from 'src/moves/moves.module';
import { Board } from 'src/board/schemas/board.schema';
import { BoardModule } from 'src/board/board.module';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Game.name, schema: GameSchema },
      { name: GamePlayer.name, schema: GamePlayerSchema },
    ]),
    MovesModule,
    BoardModule,
    AuthModule,
  ],
  providers: [GameService, GameGateway],
  controllers: [GameController]
})
export class GameModule {}
