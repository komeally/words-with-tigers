// src/lobby/lobby.module.ts
import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { LobbyGateway } from './lobby.gateway';
import { LobbyService } from './lobby.service';
import { AuthModule } from 'src/auth/auth.module';
import { SocketAuthMiddleware } from 'src/auth/middleware/socket-auth';

@Module({
  imports: [AuthModule],
  providers: [LobbyGateway, LobbyService],
})
export class LobbyModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Apply the WebSocket authentication middleware
    consumer
      .apply(SocketAuthMiddleware)
      .forRoutes('/'); // This can be adjusted depending on your setup
  }
}
