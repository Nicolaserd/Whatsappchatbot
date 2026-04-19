import {
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { Client } from 'whatsapp-web.js';
import * as QRCode from 'qrcode';
import * as child_process from 'child_process';
import fs from 'fs';

type WhatsappConnectionResponse =
  | {
      status: 'qr';
      qr: string;
      raw: string;
    }
  | {
      status: 'ready';
      message: string;
    };

@Injectable()
export class WhatsappService {
  private client: Client;
  private qrCode: string;
  private qrCodeImage: string;
  private isReady = false;
  private connectionPromise: Promise<WhatsappConnectionResponse> | null = null;

  async initClient(): Promise<WhatsappConnectionResponse> {
    if (this.isReady) {
      return {
        status: 'ready',
        message: 'WhatsApp client is already connected',
      };
    }

    const qrCodeResponse = this.getQRCode();
    if (qrCodeResponse) {
      return qrCodeResponse;
    }

    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    this.client = this.createClient();
    this.connectionPromise = this.initializeClient();

    return this.connectionPromise;
  }

  getQRCode() {
    if (!this.qrCode || !this.qrCodeImage) {
      return null;
    }

    return {
      status: 'qr' as const,
      qr: this.qrCodeImage,
      raw: this.qrCode,
    };
  }

  async sendMessage(to: string, message: string) {
    try {
      if (!this.client || !this.isReady) {
        throw new UnauthorizedException('client not connected');
      }

      await this.client.sendMessage(`${to}@c.us`, message);
      const messageEventHandler = (message) => {
        if (message.body) {
          console.log(message.from);
          this.client.off('message', messageEventHandler);
        }
      };

      this.client.on('message', messageEventHandler);
    } catch (error) {
      console.error('Error sending message:', error);
      return false;
    }
  }

  async sendMessageMock(to: string, message: string) {
    if (!this.client || !this.isReady) {
      throw new UnauthorizedException('client not connected');
    }

    try {
      await this.client.sendMessage(`${to}@c.us`, message);
      return true;
    } catch (error) {
      console.error('Error sending message:', error);
      return false;
    }
  }

  private createClient() {
    return new Client({
      webVersionCache: {
        type: 'remote',
        remotePath:
          'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html',
      },
      puppeteer: {
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      },
    });
  }

  private initializeClient(): Promise<WhatsappConnectionResponse> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.connectionPromise = null;
        reject(
          new InternalServerErrorException(
            'QR generation timed out. Try calling /whatsapp again.',
          ),
        );
      }, 45000);

      this.client.on('qr', async (qr) => {
        const qrCodeImage = await QRCode.toDataURL(qr);

        this.qrCode = qr;
        this.qrCodeImage = qrCodeImage;

        if (!process.env.VERCEL) {
          fs.writeFileSync('qr.html', `<img src="${qrCodeImage}">`);
          child_process.exec('start qr.html');
        }

        clearTimeout(timeout);
        resolve({
          status: 'qr',
          qr: qrCodeImage,
          raw: qr,
        });
      });

      this.client.on('ready', () => {
        this.isReady = true;

        clearTimeout(timeout);
        resolve({
          status: 'ready',
          message: 'WhatsApp client is ready',
        });
      });

      this.client.on('disconnected', () => {
        this.isReady = false;
        this.client = null;
        this.qrCode = null;
        this.qrCodeImage = null;
        this.connectionPromise = null;
      });

      this.client.on('error', (error) => {
        clearTimeout(timeout);
        this.connectionPromise = null;
        reject(
          new InternalServerErrorException({
            message: 'Error during WhatsApp client initialization',
            error,
          }),
        );
      });

      this.client.initialize().catch((error) => {
        clearTimeout(timeout);
        this.connectionPromise = null;
        reject(
          new InternalServerErrorException({
            message: 'Error during WhatsApp client initialization',
            error,
          }),
        );
      });
    });
  }
}
