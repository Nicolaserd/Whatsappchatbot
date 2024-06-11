import { BadRequestException, Injectable } from '@nestjs/common';
import { SingUpDto } from './singUp';
import { InjectRepository } from '@nestjs/typeorm';
import { Users } from 'src/entities/users.entity';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {

    constructor(
        @InjectRepository(Users) private usersRepository: Repository<Users>,
        private readonly jwtService: JwtService,
      ) {}
    

    async SingUp(user:SingUpDto){

        if(!user) throw new BadRequestException('Invalid user');
        const email = user.email

        const userdb = await this.usersRepository.findOneBy({email})

        if(userdb) throw new BadRequestException('Email already exist in DB');

        if (user.password !== user.confirmPassword) {
            throw new BadRequestException('Passwords do not match');
          }
        
          const { confirmPassword, ...userData } = user;
          const { password, ...userwhitoutpassword } = userData;
          const hashedPassword: string = await bcrypt.hash(password, 10);
          const finalUser: Partial<Users> = {
            ...userwhitoutpassword,
            password: hashedPassword,
          };
           await this.usersRepository.save(finalUser);
      
          return userwhitoutpassword;

    }

    async signIn(email:string,password:string){

        const userdb = await this.usersRepository.findOneBy({email})
        if(!userdb) throw new BadRequestException('Invalid credentials');

        const passwordMatch = await bcrypt.compare(password, userdb.password);

        if (!passwordMatch) {
          throw new BadRequestException('Invalid credentials (uwu)');
        }

        
    const userPayload = {
        sub: userdb.id,
        id: userdb.id,
        email: userdb.email,
        role:userdb.role 
      };
  
      const token = this.jwtService.sign(userPayload);
  
      return { success: 'user logged in successfully', token };
    

    }

}
