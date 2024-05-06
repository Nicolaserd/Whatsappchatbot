import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { WhatsappModule } from './whatsapp/whatsapp.module';
import { NplModule } from './npl/npl.module';
import { QrGeneratorModule } from './qr-generator/qr-generator.module';

@Module({
  imports: [WhatsappModule, NplModule, QrGeneratorModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
