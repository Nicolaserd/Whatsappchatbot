import {
  Body,
  Controller,
  Delete,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { Roles } from '../decorators/roles.decorator';
import { Role } from '../enum/RoleUser.enum';
import { AuthGuard } from '../guards/auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { CreateUserDto, UpdateUserDto } from './userDto';
import { UsersService } from './users.service';

@Controller('users')
@Roles(Role.Admin)
@UseGuards(AuthGuard, RolesGuard)
export class UsersController {
    constructor(private readonly userService: UsersService) {}

    @Post("/create")
    async createUser (@Body() user: CreateUserDto) {
      return this.userService.createUser(user)
    }

    @Put("/update")
    async upDateUser (@Body() user: UpdateUserDto) {
      return this.userService.upDateUser(user)
    }

    @Delete("/:id")
    async deleteUser (@Param('id', new ParseUUIDPipe()) id: string) {
      return this.userService.deleteUser(id)
    }
}
