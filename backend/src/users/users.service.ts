import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './schemas/user.schema';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private readonly jwtService: JwtService
  ) {}

  async createUser(username: string, password: string) {
    // Check if user already exists
    const existingUser = await this.userModel.findOne({ username });
    if (existingUser) {
      throw new ConflictException('Username already exists');
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the new user and save it
    const newUser = new this.userModel({ username, password: hashedPassword });
    await newUser.save();
  }

  async getUserById(userId: string) {
    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async getUserByUsername(username: string) {
    const user = await this.userModel.findOne({ username }).exec();
    
    if (!user) {
      throw new NotFoundException('User not found');
    }
  
    return user;
  }
  

  async getAllUsers() {
    return this.userModel.find().exec();
  }

  async updateUser(userId: string, username?: string, password?: string) {
    const updatedUser = await this.userModel.findByIdAndUpdate(
      userId,
      { username, password },
      { new: true }
    );
    if (!updatedUser) {
      throw new NotFoundException('User not found');
    }
    return updatedUser;
  }

  async deleteUser(userId: string) {
    const deletedUser = await this.userModel.findByIdAndDelete(userId).exec();
    if (!deletedUser) {
      throw new NotFoundException('User not found');
    }
    return deletedUser;
  }
}