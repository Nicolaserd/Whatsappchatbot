import { Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { Client, LocalAuth } from 'whatsapp-web.js';
// import * as QRCode from 'qrcode';
import * as QRCode from 'qrcode';
import * as child_process from 'child_process';
import fs from 'fs';
import path from 'path';
import { error } from 'console';



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
      }, 
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
      
   
      });
      
      this.client.on('error', (error) => {
        throw new InternalServerErrorException('Error during WhatsApp client initialization:', error)
    
      });
     
      try {
        await this.client.initialize();
       
        return this.client; // Devuelve el cliente si la inicialización fue exitosa
      } 
      catch (error) {
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
      if(!this.client){
        throw new UnauthorizedException("client not connected")
      }
      await this.client.sendMessage(`${to}@c.us`, message);
      const messageEventHandler = (message) => {
        if (message.body) {
          console.log("dentro del hola");
          console.log(message.from);
          this.client.sendMessage(message.from, "ocupado");
          console.log("entraria al off");
          // Desactiva el evento usando la variable que contiene el manejador de eventos
          this.client.off("message", messageEventHandler);
          
        }
      }
      this.client.on('message', messageEventHandler);
      
     
    } catch (error) {
      console.error('Error sending message:', error);
      return false;
    }
  }
  async sendMessageMock(to: string, message: string) {
    if(!this.client){
      throw new UnauthorizedException("client not connected")
    }
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