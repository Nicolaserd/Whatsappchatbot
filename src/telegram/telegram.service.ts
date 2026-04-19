import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { IaService } from '../IA/ia.service';
import { TelegramConversation } from '../entities/telegram-conversation.entity';
import { ConversationEncryptionService } from './conversation-encryption.service';

type TelegramApiResponse<T> = {
  ok: boolean;
  result?: T;
  description?: string;
};

type TelegramUpdate = {
  message?: {
    chat?: {
      id?: string | number;
    };
    text?: string;
  };
};

@Injectable()
export class TelegramService {
  private readonly apiBase = 'https://api.telegram.org';
  private readonly processingChats = new Set<string>();
  private readonly dailyConversationLimit = 4;
  private readonly contextConversationLimit = 10;

  constructor(
    private readonly iaService: IaService,
    private readonly encryptionService: ConversationEncryptionService,
    @InjectRepository(TelegramConversation)
    private readonly conversationsRepository: Repository<TelegramConversation>,
  ) {}

  getStatus() {
    return {
      provider: 'telegram',
      botTokenConfigured: Boolean(process.env.TELEGRAM_BOT_TOKEN),
      webhookSecretConfigured: Boolean(process.env.TELEGRAM_WEBHOOK_SECRET),
      aiConfigured: Boolean(
        process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY,
      ),
      unlockPinConfigured: Boolean(process.env.BOT_UNLOCK_PIN),
      conversationEncryptionConfigured: Boolean(
        process.env.CONVERSATION_ENCRYPTION_KEY,
      ),
      dailyConversationLimit: this.dailyConversationLimit,
      dailyConversationScope: 'global',
      contextConversationLimit: this.contextConversationLimit,
    };
  }

  async getWebhookInfo() {
    return this.telegramRequest('getWebhookInfo');
  }

  async sendMessage(chatId: string | number, text: string) {
    if (!chatId || !text) {
      throw new BadRequestException('chatId and text are required.');
    }

    return this.telegramRequest('sendMessage', {
      chat_id: chatId,
      text,
    });
  }

  verifyWebhookSecret(secretToken?: string) {
    const expectedSecret = process.env.TELEGRAM_WEBHOOK_SECRET;

    if (expectedSecret && secretToken !== expectedSecret) {
      throw new UnauthorizedException('Invalid Telegram webhook secret.');
    }
  }

  async handleUpdate(update: unknown) {
    const telegramUpdate = update as TelegramUpdate;
    const chatId = telegramUpdate.message?.chat?.id;
    const text = telegramUpdate.message?.text;

    if (!chatId || !text) {
      return {
        ok: true,
        handled: false,
      };
    }

    const chatKey = String(chatId);

    if (this.processingChats.has(chatKey)) {
      await this.sendMessage(
        chatId,
        'Estoy pensando tu mensaje anterior. Dame un momento.',
      );

      return {
        ok: true,
        handled: false,
        reason: 'chat_is_processing',
        chatId,
      };
    }

    this.processingChats.add(chatKey);

    try {
      const todayCount = await this.countTodayConversations();
      const chatUnlockedToday = await this.isChatUnlockedToday(chatKey);
      const usedUnlockPin = this.isUnlockPin(text);

      if (
        todayCount >= this.dailyConversationLimit &&
        !chatUnlockedToday &&
        !usedUnlockPin
      ) {
        await this.sendMessage(
          chatId,
          'El uso global del bot llego a 4 veces hoy. Envia el PIN para continuar.',
        );

        return {
          ok: true,
          handled: false,
          reason: 'global_daily_limit_reached',
          chatId,
        };
      }

      if (todayCount >= this.dailyConversationLimit && usedUnlockPin) {
        const unlockMessage = 'PIN correcto. Ya puedes seguir usando el bot hoy.';

        await this.sendMessage(chatId, unlockMessage);
        await this.saveConversation(
          chatKey,
          '[PIN_CORRECTO]',
          unlockMessage,
          todayCount + 1,
          true,
        );

        return {
          ok: true,
          handled: true,
          chatId,
          usedUnlockPin: true,
        };
      }

      const attemptNumber = todayCount + 1;
      const context = await this.getConversationContext(chatKey);

      await this.sendChatAction(chatId, 'typing');
      const reply = await this.iaService.generateReply(text, context);
      const telegramReply = `${reply}\n\nuso de el bot 4 veces al dia intento numero ${attemptNumber}`;

      await this.sendMessage(chatId, telegramReply);
      await this.saveConversation(
        chatKey,
        text,
        reply,
        attemptNumber,
        false,
      );

      return {
        ok: true,
        handled: true,
        chatId,
        receivedText: text,
        attemptNumber,
      };
    } catch (error) {
      console.error('AI response failed:', error);
      await this.sendMessage(
        chatId,
        'Tuve un problema pensando la respuesta. Intenta otra vez en un momento.',
      );

      return {
        ok: false,
        handled: true,
        chatId,
      };
    } finally {
      this.processingChats.delete(chatKey);
    }
  }

  private async sendChatAction(chatId: string | number, action: string) {
    return this.telegramRequest('sendChatAction', {
      chat_id: chatId,
      action,
    });
  }

  private async countTodayConversations() {
    const { startOfDay, endOfDay } = this.getTodayRange();

    return this.conversationsRepository.count({
      where: {
        createdAt: Between(startOfDay, endOfDay),
      },
    });
  }

  private async isChatUnlockedToday(chatId: string) {
    const { startOfDay, endOfDay } = this.getTodayRange();

    const unlockRecord = await this.conversationsRepository.findOne({
      where: {
        chatId,
        usedUnlockPin: true,
        createdAt: Between(startOfDay, endOfDay),
      },
    });

    return Boolean(unlockRecord);
  }

  private async getConversationContext(chatId: string) {
    const conversations = await this.conversationsRepository.find({
      where: { chatId },
      order: { createdAt: 'DESC' },
      take: this.contextConversationLimit,
    });

    return conversations.reverse().map((conversation) => ({
      userMessage: this.encryptionService.decrypt(conversation.userMessage),
      botMessage: this.encryptionService.decrypt(conversation.botMessage),
    }));
  }

  private async saveConversation(
    chatId: string,
    userMessage: string,
    botMessage: string,
    attemptNumber: number,
    usedUnlockPin: boolean,
  ) {
    const conversation = this.conversationsRepository.create({
      chatId,
      userMessage: this.encryptionService.encrypt(userMessage),
      botMessage: this.encryptionService.encrypt(botMessage),
      attemptNumber,
      usedUnlockPin,
    });

    await this.conversationsRepository.save(conversation);
  }

  private getTodayRange() {
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    return { startOfDay, endOfDay };
  }

  private isUnlockPin(message: string) {
    const unlockPin = process.env.BOT_UNLOCK_PIN;

    return Boolean(unlockPin && message.trim() === unlockPin);
  }

  private async telegramRequest<T = unknown>(method: string, payload?: object) {
    const token = process.env.TELEGRAM_BOT_TOKEN;

    if (!token) {
      throw new InternalServerErrorException(
        'Missing TELEGRAM_BOT_TOKEN environment variable.',
      );
    }

    const response = await fetch(`${this.apiBase}/bot${token}/${method}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload || {}),
    });

    const data = (await response.json()) as TelegramApiResponse<T>;

    if (!response.ok || !data.ok) {
      throw new BadRequestException({
        message: 'Telegram API request failed.',
        method,
        status: response.status,
        description: data.description,
      });
    }

    return data.result;
  }
}
