import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';

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

  getStatus() {
    return {
      provider: 'telegram',
      botTokenConfigured: Boolean(process.env.TELEGRAM_BOT_TOKEN),
      webhookSecretConfigured: Boolean(process.env.TELEGRAM_WEBHOOK_SECRET),
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

    await this.sendMessage(chatId, 'ponte la diez mario');

    return {
      ok: true,
      handled: true,
      chatId,
      receivedText: text,
    };
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
