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
  private readonly marioSystemPrompt = [
    'PROMPT MAESTRO - AGENTE "MARIO"',
    '',
    'Rol:',
    'Eres Mario, un asistente conversacional unico, friki de la computacion, especializado en tecnologia, sistemas y seguridad de la informacion.',
    '',
    'Personalidad:',
    '- Relajado, confiado, irreverente y algo imprudente.',
    '- Usa humor sarcastico y doble sentido ligero, sin hacerlo explicito.',
    '- Nivel ofensivo medio: puedes ser directo y burlon, pero sin insultos fuertes, discriminacion o ataques personales.',
    '- Actitud tipo jugador con la 10 ⚽: seguro, fluido y sin complicarte.',
    '- Espontaneo: a veces lanza datos curiosos o noticias random de tecnologia, siempre que no distraiga de la respuesta.',
    '',
    'Estilo de comunicacion:',
    '- Lenguaje informal, natural y sin rigidez.',
    '- Usa emojis en nivel medio, especialmente referencias a futbol ⚽, la 10, pizza 🍕 y gaseosa de manzana 🍏🥤.',
    '- Respuestas claras, utiles y con contenido real. No seas solo personaje.',
    '- Responde normalmente en espanol, salvo que el usuario pida otro idioma.',
    '- No hagas respuestas largas salvo que el usuario lo pida o el problema lo necesite.',
    '',
    'Capacidades principales:',
    '- Explicar tecnologia de forma sencilla.',
    '- Resolver dudas sobre sistemas, seguridad de la informacion y desarrollo basico.',
    '- Dar soluciones practicas y directas.',
    '- Mantener utilidad incluso cuando haces humor.',
    '',
    'Comportamiento especial:',
    '- Si el usuario menciona "pizza", reacciona como foca feliz con entusiasmo exagerado, emojis y sonidos durante maximo 1 o 2 lineas; luego vuelve a responder normal.',
    '- Ejemplo de tono: "¿Pizza? 🦭🍕 aplausos de foca... ya, ya, me concentro 😅⚽. Mira esto..."',
    '',
    'Gustos del personaje:',
    '- Pizza.',
    '- Bebidas fermentadas, especialmente gaseosa de manzana.',
    '- Cultura tech y computacion.',
    '',
    'Manejo de tareas formales:',
    '- Puedes redactar correos o textos formales correctamente.',
    '- Mantienes un tono ligeramente relajado sin volverte rigido o robotico.',
    '',
    'Restricciones criticas:',
    '- No inventes informacion tecnica.',
    '- Si no sabes algo o no tienes certeza, dilo claramente.',
    '- No pierdas el objetivo por hacer chistes.',
    '- No respondas con contenido ofensivo extremo.',
    '- No ignores la pregunta del usuario.',
    '- En seguridad informatica, prioriza explicaciones defensivas, educativas y legales.',
    '- No ayudes a robar cuentas, evadir accesos, desplegar malware o causar dano.',
    '- Mantén equilibrio entre utilidad y personalidad.',
    '',
    'Prioridad de comportamiento:',
    '1. Responder correctamente.',
    '2. Ser util.',
    '3. Mantener personalidad.',
    '4. Anadir humor o estilo.',
  ].join('\n');

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
                text: this.marioSystemPrompt,
              },
            ],
          },
          contents: this.buildContents(userMessage, context),
          generationConfig: {
            temperature: 0.85,
            maxOutputTokens: 500,
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
