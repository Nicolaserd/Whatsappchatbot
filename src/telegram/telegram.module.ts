import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IaModule } from '../IA/ia.module';
import { TelegramConversation } from '../entities/telegram-conversation.entity';
import { ConversationEncryptionService } from './conversation-encryption.service';
import { TelegramController } from './telegram.controller';
import { TelegramService } from './telegram.service';

@Module({
  imports: [IaModule, TypeOrmModule.forFeature([TelegramConversation])],
  controllers: [TelegramController],
  providers: [TelegramService, ConversationEncryptionService],
})
export class TelegramModule {}
