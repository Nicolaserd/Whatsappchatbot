import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SingUpDto } from './singUp';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService:AuthService){}
    
    @Post('/singup')
    singUp(@Body() credentials:SingUpDto){

        return  this.authService.SingUp(credentials)
    }
    @Post('/singin')
    singIn(@Body() credentials: SingUpDto ) {
      const { email, password } = credentials;
      return this.authService.signIn(email, password);
    }
}
