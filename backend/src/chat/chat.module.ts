import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ChatService } from './chat.service';
import { SocketAuthMiddleware } from 'src/auth/middleware/socket-auth';
import { MongooseModule } from '@nestjs/mongoose';
import { Message, MessageSchema } from './schemas/message.schema';
import { ChatGateway } from './chat.gateway';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Message.name, schema: MessageSchema }]),
    AuthModule
  ],
  providers: [ChatService, ChatGateway]
})
export class ChatModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Apply the WebSocket authentication middleware
    consumer
      .apply(SocketAuthMiddleware)
      .forRoutes('/'); // This can be adjusted depending on your setup
  }
}