import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignUpDto } from './signUp';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService:AuthService){}

    @Post('/signup')
    signUp(@Body() credentials:SignUpDto){

        return  this.authService.signUp(credentials)
    }
    @Post('/signin')
    signIn(@Body() credentials: SignUpDto ) {
      const { email, password } = credentials;
      return this.authService.signIn(email, password);
    }
}
