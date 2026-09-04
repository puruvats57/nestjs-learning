import {
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
} from '@nestjs/common';

import {
  CurrentUser,
  type AuthUser,
} from '../auth/decorators/current-user.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UsersService } from './users.service.js';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // Public — anyone can register
  @Post()
  createUser(@Body() dto: CreateUserDto) {
    return this.usersService.createUser(dto);
  }

  // Protected — needs Authorization: Bearer <token>
  @UseGuards(JwtAuthGuard)
  @Get()
  getUsers() {
    return this.usersService.getUsers();
  }

  // Protected — current logged-in user from the JWT
  @UseGuards(JwtAuthGuard)
  @Get('me')
  getMe(@CurrentUser() user: AuthUser) {
    return this.usersService.findById(user.userId);
  }
}
