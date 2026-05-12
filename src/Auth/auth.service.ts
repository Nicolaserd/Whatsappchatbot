import { BadRequestException, Injectable } from '@nestjs/common';
import { SignUpDto } from './signUp';
import { InjectRepository } from '@nestjs/typeorm';
import { Users } from '../entities/users.entity';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Role } from '../enum/RoleUser.enum';

@Injectable()
export class AuthService {

    constructor(
        @InjectRepository(Users) private usersRepository: Repository<Users>,
        private readonly jwtService: JwtService,
      ) {}


    async signUp(user:SignUpDto){

        if(!user) throw new BadRequestException('Invalid user');
        const email = user.email

        const userdb = await this.usersRepository.findOneBy({email})

        if(userdb) throw new BadRequestException('Email already exist in DB');

        if (user.password !== user.confirmPassword) {
            throw new BadRequestException('Passwords do not match');
          }
        
          const { confirmPassword, password, ...userData } = user;
          const hashedPassword: string = await bcrypt.hash(password, 10);
          const finalUser: Partial<Users> = {
            ...userData,
            password: hashedPassword,
            role: Role.Usuario,
          };
           const saved = await this.usersRepository.save(finalUser);

          const { password: _pwd, ...userwhitoutpassword } = saved;
          return userwhitoutpassword;

    }

    async signIn(email:string,password:string){

        const userdb = await this.usersRepository.findOneBy({email})
        
        if(!userdb) throw new BadRequestException(`Invalid credentials ${email}`);

        const passwordMatch = await bcrypt.compare(password, userdb.password);

        if (!passwordMatch) {
          throw new BadRequestException('Invalid credentials (uwu)');
        }

        
    const userPayload = {
        sub: userdb.id,
        id: userdb.id,
        email: userdb.email,
        role:userdb.role,
        country:userdb.country,
      };
      

     
      const token = this.jwtService.sign(userPayload);
  
      return { success: 'user logged in successfully', token };
    

    }

}
