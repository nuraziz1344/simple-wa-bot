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
  try {
      if (msg.body == 'ping') {
          msg.reply('pong');
      } else if(msg.type == MessageTypes.IMAGE || MessageTypes.VIDEO || MessageTypes.DOCUMENT) {
          const media = await msg.downloadMedia()
          if(media.mimetype.startsWith('image') || media.mimetype.startsWith('video')){
            msg.reply(media, msg.id.remote, { sendMediaAsSticker: true, stickerAuthor: "Created By", stickerName: "CRazyzBOT"});
          }
      } else if(msg.type == MessageTypes.STICKER){
          const media = await msg.downloadMedia()
          msg.reply(media, msg.id.remote)
      } else {
          console.log(msg)
      }
  } catch (error) {
      console.error(error) 
  }
});

client.initialize();