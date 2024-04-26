import { Injectable } from '@nestjs/common';
import { Client, LocalAuth } from 'whatsapp-web.js';
// import * as QRCode from 'qrcode';
import * as QRCode from 'qrcode';
import * as child_process from 'child_process';
import fs from 'fs';
import path from 'path';



@Injectable()
export class WhatsappService {
  private client: Client;
  private qrCode: string;

  async initClient() {
    const cliente = new Client({
      webVersionCache: {
        type: "remote",
        remotePath:
          "https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html",
      }, // Agregar coma aquí
    });

      
      
      this.client = cliente;
      this.client.on('qr', async (qr) => {
        console.log("dentro del qr", qr);
        fs.writeFileSync('qr.html', `<img src="${await QRCode.toDataURL(qr)}">`);
        child_process.exec('start qr.html');
        this.qrCode = qr;
      });
  

      this.client.on('ready', () => {
        console.log('WhatsApp client is ready');
      
        return this.client
   
      });
      
      this.client.on('error', (error) => {
        console.error('Error during WhatsApp client initialization:', error);
      });
     
      try {
        await this.client.initialize();
        console.log('Inicialización exitosa');
        return this.client; // Devuelve el cliente si la inicialización fue exitosa
      } catch (error) {
        console.error('Error durante la inicialización:', error);
        throw error; // Lanza el error para manejarlo en un nivel superior si es necesario
      }
      

     
  }

  getQRCode() {
    return this.qrCode;
  }

  async sendMessage(to: string, message: string) {
    
    try {
      console.log(this.client)
      await this.client.sendMessage(`${to}@c.us`, message);
      return true;
    } catch (error) {
      console.error('Error sending message:', error);
      return false;
    }
  }
  async sendMessageMock(to: string, message: string) {
    try {
      console.log(this.client)
      await this.client.sendMessage(`${to}@c.us`, message);
      return true;
    } catch (error) {
      console.error('Error sending message:', error);
      return false;
    }
  }
}