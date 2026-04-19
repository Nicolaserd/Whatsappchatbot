import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { MessageDto } from './messageDto';

type GeminiResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
  error?: {
    message?: string;
  };
};

export type AiConversationContext = {
  userMessage: string;
  botMessage: string;
};

@Injectable()
export class IaService {
  private readonly apiBase = 'https://generativelanguage.googleapis.com/v1beta';

  async sendMessage(message: MessageDto) {
    return this.generateReply(message.message);
  }

  async generateReply(
    userMessage: string,
    context: AiConversationContext[] = [],
  ) {
    const apiKey = process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY;
    const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

    if (!apiKey) {
      throw new InternalServerErrorException(
        'Missing GOOGLE_AI_API_KEY environment variable.',
      );
    }

    const response = await fetch(
      `${this.apiBase}/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [
              {
                text: [
                  'Eres Mario, un agente amable y breve dentro de Telegram.',
                  'Responde en espanol claro.',
                  'Si no sabes algo, dilo con honestidad.',
                  'No uses respuestas largas salvo que el usuario lo pida.',
                ].join(' '),
              },
            ],
          },
          contents: this.buildContents(userMessage, context),
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 300,
          },
        }),
      },
    );

    const data = (await response.json()) as GeminiResponse;

    if (!response.ok || data.error) {
      throw new InternalServerErrorException({
        message: 'Google AI request failed.',
        status: response.status,
        error: data.error?.message,
      });
    }

    const text = data.candidates?.[0]?.content?.parts
      ?.map((part) => part.text)
      .filter(Boolean)
      .join('\n')
      .trim();

    if (!text) {
      return 'No pude generar una respuesta en este momento.';
    }

    return text;
  }

  private buildContents(
    userMessage: string,
    context: AiConversationContext[],
  ) {
    const contextMessages = context.flatMap((conversation) => [
      {
        role: 'user',
        parts: [{ text: conversation.userMessage }],
      },
      {
        role: 'model',
        parts: [{ text: conversation.botMessage }],
      },
    ]);

    return [
      ...contextMessages,
      {
        role: 'user',
        parts: [{ text: userMessage }],
      },
    ];
  }
}
