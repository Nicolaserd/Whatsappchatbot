import { Injectable } from '@nestjs/common';
import * as QRCode from 'qrcode';
function generarCodigo(length) {
    let caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let codigo = '';
    for (let i = 0; i < length; i++) {
        codigo += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
    }
    return codigo;
}

@Injectable()
export class QrGeneratorService {
    
    async generarQr(){
        let codigoAleatorio = generarCodigo(8);
        //! Pasaria al endpoint con  un codigo donde sera reviado por el usuario o el cowork
        const elText = `www.google.com/${codigoAleatorio}`;

        console.log(await QRCode.toString(elText))
    }
}
