import { Controller, Post, Get, Param, Body, Put, Delete, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { LocalAuthGuard } from 'src/auth/auth.guard';
import { Public } from 'src/auth/public.decorator';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Public()
  @UseGuards(LocalAuthGuard)
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async createUser(@Body() body: { username: string; password: string }) {
    try {
        return await this.usersService.createUser(body.username, body.password);
    } catch (error) {
        throw error;
    }
  }

  @Public()
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async getUserById(@Param('id') id: string) {
    try {
        return await this.usersService.getUserById(id);
    } catch (error) {
        throw error;
    }
  }

  @Public()
  @Get()
  @HttpCode(HttpStatus.OK)
  async getAllUsers() {
    return this.usersService.getAllUsers();
  }

  @Public()
  @Put(':id')
  @HttpCode(HttpStatus.OK)
  async updateUser(
    @Param('id') id: string,
    @Body() body: { username?: string; password?: string }) {
    try {
        return await this.usersService.updateUser(id, body.username, body.password);
    } catch (error) {
        throw error;
    }
  }

  @Public()
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async deleteUser(@Param('id') id: string) {
    try {
        return this.usersService.deleteUser(id);
    } catch (error) {
        throw error;
    }
  }
}