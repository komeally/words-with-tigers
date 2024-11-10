import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../auth.service';
import { Socket } from 'socket.io';

@Injectable()
export class SocketAuthMiddleware implements NestMiddleware {
  constructor(private readonly authService: AuthService) {}

  async use(socket: Socket, next: Function) {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
      if (!token) {
        throw new UnauthorizedException('No token provided');
      }

      const decoded = await this.authService.verifyToken(token);
      socket.data.user = decoded;
      next();
    } catch (error) {
      console.error('Authentication failed:', error.message);
      next(new UnauthorizedException('Authentication error'));
    }
  }
}
