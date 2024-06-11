import { Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { Client, LocalAuth } from 'whatsapp-web.js';
// import * as QRCode from 'qrcode';
import * as QRCode from 'qrcode';
import * as child_process from 'child_process';
import fs from 'fs';
const SESSION_FILE_PATH = './session.json';



@Injectable()
export class WhatsappService {
  private client: Client;
  private qrCode: string;


  async initClient() {

    console.log("hola")

    const cliente = new Client({
      webVersionCache: {
        type: "remote",
        remotePath:
          "https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html",
      }, 
    });

    console.log("cliente : ",cliente)
      
      this.client = cliente;
    //   if (fs.existsSync(SESSION_FILE_PATH)) {
    //     const sessionData = JSON.parse(fs.readFileSync(SESSION_FILE_PATH, 'utf-8'));
    //     this.client = new Client({ session: sessionData });
    // }

   

      this.client.on('qr', async (qr) => {
        console.log("dentro del qr", qr);
        fs.writeFileSync('qr.html', `<img src="${await QRCode.toDataURL(qr)}">`);
        child_process.exec('start qr.html');
        this.qrCode = qr;
      });
  

      this.client.on('ready', () => {
        console.log('WhatsApp client is ready');
        
        // const session = {
        //   pushname: this.client.info.pushname,
        //   wid: this.client.info.wid._serialized
        //   // Agrega más campos relevantes de ser necesario
        //  };
        // console.log(session);
        // if (session.pushname && session.wid) {
        //     console.log('Autenticado exitosamente');
        //     console.log(session);
        //     // Guardar la sesión al autenticar
        //     fs.writeFileSync(SESSION_FILE_PATH, JSON.stringify(session));
        //     console.log('Sesión guardada exitosamente');
        // } else {
        //     console.error('Error: sesión no disponible');
        // }

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
          // this.client.sendMessage(message.from, "ocupado");
          if(message.from==="hola"){
            console.log("hola")
          }
          if(message.from==="chao"){
            console.log("hola")
          }
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