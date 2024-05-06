import { Controller, Get } from '@nestjs/common';
import { QrGeneratorService } from './qr-generator.service';

@Controller('qr-generator')
export class QrGeneratorController {
  constructor(private readonly qrService: QrGeneratorService) {}  
  @Get()
  async initClient() {
    try {
      return this.qrService.generarQr()
    } catch (error) {
      
     
    }
   
  }
}
