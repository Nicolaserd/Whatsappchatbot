import { Body, Controller, Post, Put } from '@nestjs/common';
import { CreateUserDto, UpdateUserDto } from './userDto';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
    constructor(private readonly userService: UsersService) {}

    @Post("/create")
    async createUser (@Body() user: CreateUserDto) {
      this.userService.createUser(user)
    }

    @Put("/update")
    async upDateUser (@Body() user: UpdateUserDto) {
      this.userService
    }
}
