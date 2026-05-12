import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Users } from '../entities/users.entity';
import { Repository } from 'typeorm';
import { CreateUserDto, UpdateUserDto } from './userDto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(Users) private usersRepository: Repository<Users>,
      ) {}

    async createUser (user: CreateUserDto) {
        const hashedPassword = await bcrypt.hash(user.password, 10);
        const newUser = await this.usersRepository.save({
          ...user,
          password: hashedPassword,
        });

        const { password, ...userNoPassword } = newUser;
        return userNoPassword;
    }


    async upDateUser (user:UpdateUserDto){

        const upDateUser = await this.usersRepository.findOne({where:{id:user.id}})
        if(!upDateUser)  throw new BadRequestException('USUARIO NO ENCONTRADO');

        if(user.password){
            const hashedPassword: string = await bcrypt.hash(user.password, 10);
            user.password=hashedPassword
          }


          await this.usersRepository.update(upDateUser.id, user);
          const updateUser = await this.usersRepository.findOne({where:{id:user.id}})
          const { password,...userWhitoutPassword  } = updateUser;
          return userWhitoutPassword;

    }

    async deleteUser (id: string) {
        const user = await this.usersRepository.findOne({ where: { id } });
        if (!user) throw new BadRequestException('USUARIO NO ENCONTRADO');

        await this.usersRepository.remove(user);
        return { success: 'usuario eliminado', id };
    }
}
