import { Body, Controller, Post } from '@nestjs/common';
import { NplService } from './npl.service'; 

@Controller('npl')
export class NplController {
  constructor(private readonly nlpService: NplService) {}

  @Post()
  async tokenizeMessage(@Body('message') message: string): Promise<string[]> {
    console.log(message)
    return this.nlpService.tokenize(message);
  }

  }
