import { Body, Controller, Post } from '@nestjs/common';
import { NplService } from './npl.service'; 

@Controller('npl')
export class NplController {
  constructor(private readonly nlpService: NplService) {}

  @Post()
  async tokenizeMessage(@Body() user: string){
  
  }




  }
