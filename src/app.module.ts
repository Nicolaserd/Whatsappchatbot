import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { WhatsappModule } from './whatsapp/whatsapp.module';
import { NplModule } from './npl/npl.module';

@Module({
  imports: [WhatsappModule, NplModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
