// src/lobby/lobby.module.ts
import { Module } from '@nestjs/common';
import { LobbyGateway } from './lobby.gateway';
import { LobbyService } from './lobby.service';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [AuthModule],
  providers: [LobbyGateway, LobbyService],
})
export class LobbyModule {
  
}
