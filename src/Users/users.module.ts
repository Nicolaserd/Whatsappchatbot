import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Users } from '../entities/users.entity';
import { Messages } from '../entities/message.entity';

@Module({
    providers: [UsersService],
    controllers: [UsersController],
    imports: [TypeOrmModule.forFeature([Users,Messages])],
})
export class UsersModule {
  
}
