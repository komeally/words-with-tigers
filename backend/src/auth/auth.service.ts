import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Socket } from 'socket.io';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService
  ) {}
  
  async login(user: any) {
    const payload = { username: user.username, sub: user._id };
    return { access_token: this.jwtService.sign(payload), user };
  }
  
  async validateUser(username: string, pass: string): Promise<any> {
    const user = await this.usersService.getUserByUsername(username);
    
    if (user && await bcrypt.compare(pass, user.password)) {
      const { password, ...result } = user.toObject();
      return result;
    }
    return null;
  }

  async verifyToken(token: string) {
    try {
      // Verify and decode the token
      return await this.jwtService.verifyAsync(token);
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  async authenticateSocket(socket: Socket): Promise<void> {
    const token = socket.handshake.auth.token; // Retrieve the token from socket auth
    if (!token) {
      throw new UnauthorizedException('Token not provided');
    }

    try {
      // Verify and decode token
      const decoded = this.jwtService.verify(token);
      
      // Retrieve the user by ID from the token payload
      const user = await this.usersService.getUserById(decoded.sub);
      
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      // Attach the full user data and token to the socket's data
      socket.data.user = user;
      socket.data.access_token = token;
      socket.data.roomId = socket.handshake.auth.roomId || 'lobby';
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}