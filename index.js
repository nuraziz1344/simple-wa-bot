const { Client, LocalAuth, MessageMedia, MessageTypes } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal')
const { resolve } = require('path')
const { schedule } = require('node-cron')

console.log('Starting...')
const client = new Client({
  puppeteer: {
    userDataDir: resolve('.puppeteer'),
    authStrategy: new LocalAuth(),
    headless: 'new',
    devtools: false,
    executablePath: '/home/runner/.nix-profile/bin/chromium',
    args: [
        '--aggressive-tab-discard',
        '--disable-accelerated-2d-canvas',
        '--disable-application-cache',
        '--disable-cache',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-offline-load-stale-cache',
        '--disable-setuid-sandbox',
        '--disable-setuid-sandbox',
        '--disk-cache-size=0',
        '--ignore-certificate-errors',
        '--no-first-run',
        '--no-sandbox',
        '--no-zygote',
    ]
  }
});

client.on('loading_screen', (percent, message) => {
    console.log('Loading: %s%', percent);
});

client.on('qr', (qr) => {
    console.log('scan this QRCode!')
    qrcode.generate(qr, {small: true}, function (qrcode) {
      console.log(qrcode)
    });
});

client.on('ready', () => {
    console.log('Connected!');
    schedule('* * * * *', ()=>{
      const usage = (process.memoryUsage().rss/1048576).toFixed(1)
      console.log('RAM usage: %sMiB', usage)
    })
});

client.on('message', async msg => {
    if (msg.body == 'ping') {
        msg.reply('pong');
    } else if(msg.type == 'image') {
        const media = await msg.downloadMedia()
        client.sendMessage(msg.id.remote, media, { sendMediaAsSticker: true, stickerAuthor: "Created By", stickerName: "CRazyzBOT", quotedMessageId:msg.id });
    } else {
      console.log(msg)
    }
});

client.initialize();