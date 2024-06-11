import { Controller, Get, Res, Req, InternalServerErrorException, Query, UseGuards } from '@nestjs/common';
import { WhatsappService } from './whatsapp.service';
import { Request, Response } from 'express';
import { AuthGuard } from 'src/guards/auth.guard';
import { Role } from 'src/enum/RoleUser.enum';
import { Roles } from 'src/decorators/roles.decorator';
import { RolesGuard } from 'src/guards/roles.guard';


@Controller('whatsapp')
export class WhatsappController {
  constructor(private readonly whatsappService: WhatsappService) {}

  @Get()
  @UseGuards(AuthGuard)
  async initClient() {
    try {
      await this.whatsappService.initClient();
      return { message: 'WhatsApp client initialized successfully' };
    } catch (error) {
      
      throw new InternalServerErrorException({ errormsg: 'An error occurred during initialization',error})
    }
   
  }

  @Get('qr-code')
  @Roles(Role.Admin)
  @UseGuards(AuthGuard,RolesGuard)
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