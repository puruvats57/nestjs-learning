import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';

import { CreateUserDto } from './dto/create-user.dto.js';
import { User } from './entities/user.entity.js';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async getUsers() {
    return this.userRepository.find({
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async createUser(dto: CreateUserDto) {
    const existingUser = await this.userRepository.findOne({
      where: {
        email: dto.email,
      },
    });

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = this.userRepository.create({
      name: dto.name,
      email: dto.email,
      password: hashedPassword,
    });

    const savedUser = await this.userRepository.save(user);

    const { password: _password, ...result } = savedUser;

    return result;
  }

  async findByEmail(email: string) {
    return this.userRepository.findOne({
      where: {
        email,
      },
    });
  }

  async findById(id: number) {
    const user = await this.userRepository.findOne({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }
}
