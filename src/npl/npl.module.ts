import { Module } from '@nestjs/common';
import { NplService } from './npl.service';
import { NplController } from './npl.controller';
import { WordTokenizer } from 'natural'; 

@Module({
  providers: [ NplService,WordTokenizer],
  controllers: [NplController],
  imports:[]
})
export class NplModule {}
