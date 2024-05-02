import { Injectable } from '@nestjs/common';
import * as natural from 'natural';

@Injectable()
export class NplService {
    // private tokenizer: natural.WordTokenizer;
    constructor(private readonly tokenizer: natural.WordTokenizer ) {
        
      }
      async tokenize(message: string): Promise<string[]> {
        return this.tokenizer.tokenize(message);
      }
}
