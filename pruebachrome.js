const { Client } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const client = new Client({
  webVersionCache: {
    type: "remote",
    remotePath:
      "https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html",
  }, // Agregar coma aquí
});

client.on('ready', () => {
    console.log('Client is ready!');
});

client.on('qr', qr => {
    console.log("dentor de el qr")
    qrcode.generate(qr, {small: true});
});

client.initialize();
