import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import userPreload from 'src/PreloadTemplates/Users';
import { Messages } from 'src/entities/message.entity';
import { Users } from 'src/entities/users.entity';
import { Repository } from 'typeorm';
import { CreateUserDto, UpdateUserDto } from './userDto';
import * as bcrypt from 'bcrypt';




@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(Users) private usersRepository: Repository<Users>,
        @InjectRepository(Messages)
        private readonly messagesRepository: Repository<Messages>,
       
      ) {}
    async onModuleInit() {
        await this.loadData();
      }
    
      private async loadData() {
        // Lógica para cargar los datos iniciales
        console.log('Preloading data...');
        const arrayUsers = userPreload.users
        await Promise.all(arrayUsers.map(async (user) => {
            const { messages, ...userInitial } = user;
            const newUser = await this.usersRepository.create(userInitial);
            await this.usersRepository.save(newUser);
            console.log(`usuario ${user.name} agregado`)
        
            newUser.messages = await Promise.all(messages.map(async (messageData) => {
                const message = await this.messagesRepository.create(messageData);
                message.user = newUser; // Relaciona el mensaje con el usuario
                await this.messagesRepository.save(message)
                console.log(`Mensaje de usuario ${user.name} agregado`)
                return message;
            }));
                
            // Usamos await aquí para esperar a que se guarde el usuario en la base de datos
           
          }));
        // Ejemplo de carga de datos
        // await this.someRepository.save(initialData);
      }

    async createUser (user:CreateUserDto){

        const newUser = await this.usersRepository.save(user);
        
        const {password,...userNoPassword}=newUser

        return userNoPassword
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
}
