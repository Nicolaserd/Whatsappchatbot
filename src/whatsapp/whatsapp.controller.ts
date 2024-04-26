import { Controller, Get, Res, Req } from '@nestjs/common';
import { WhatsappService } from './whatsapp.service';

@Controller('whatsapp')
export class WhatsappController {
  constructor(private readonly whatsappService: WhatsappService) {}

  @Get()
  async initClient(@Res() res: any) {
    try {
      await this.whatsappService.initClient();
      return res.status(200).send({ message: 'WhatsApp client initialized successfully' });
    } catch (error) {
      console.error('Error initializing WhatsApp client:', error);
      return res.status(500).send({ error: 'An error occurred during initialization' });
    }
   
  }

  @Get('qr-code')
  async getQRCode(@Res() res: any) {
    const qrCode = await this.whatsappService.getQRCode();
    res.send(qrCode);
  }

  @Get('send-message')
  async sendMessage(@Req() req: any, @Res() res: any) {
    const to = req.query.to;
    console.log(to)
    const message = req.query.message;
    await this.whatsappService.sendMessage(to, message);
    res.send(`Message sent to ${to}`);
  }
  @Get('send')
  async sendMessageMock(): Promise<string> {
    const to = '573057139607'; // Número de teléfono en formato internacional
    const message = 'Hello';
    
    const sent = await this.whatsappService.sendMessageMock(to, message);
    if (sent) {
      return 'Message sent successfully!';
    } else {
      return 'Failed to send message.';
    }
  }
}