import { Controller, Get, Res, Req, InternalServerErrorException, Query } from '@nestjs/common';
import { WhatsappService } from './whatsapp.service';
import { Request, Response } from 'express';


@Controller('whatsapp')
export class WhatsappController {
  constructor(private readonly whatsappService: WhatsappService) {}

  @Get()
  async initClient() {
    try {
      await this.whatsappService.initClient();
      return { message: 'WhatsApp client initialized successfully' };
    } catch (error) {
      
      throw new InternalServerErrorException({ errormsg: 'An error occurred during initialization',error})
    }
   
  }

  @Get('qr-code')
  async getQRCode() {
    const qrCode = await this.whatsappService.getQRCode();
    if(!qrCode){
      throw new InternalServerErrorException({error:"not found qr"})
    }
    return qrCode
  }

  @Get('send-message')
  async sendMessage(
  @Query('to') to: string,
  @Query('message') message: string,
  ) {
   
    await this.whatsappService.sendMessage(to, message);
    return`mensaje enviado a ${to}`
  }
  @Get('send')
  async sendMessageMock(): Promise<string> {
    const to = '573057139697'; // Número de teléfono en formato internacional
    const message = 'Hello';
    
    const sent = await this.whatsappService.sendMessageMock(to, message);
    if (sent) {
      return 'Message sent successfully!';
    } else {
      return 'Failed to send message.';
    }
  }
}