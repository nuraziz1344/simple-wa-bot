const { Client, LocalAuth, MessageTypes, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal')
const { resolve } = require('path')
const { schedule } = require('node-cron')
const sharp = require('sharp')
const express = require('express')()

express.get('/', (req, res)=>{
  res.send('ok')
})

express.listen(3000, '0.0.0.0', ()=>{
  console.log('Starting...')
})

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
      if (/^((\.)|(ping)|(test?))$/i.test(msg.body) && !msg.hasQuotedMsg) {
          msg.reply(msg.body);
      } else if(msg.hasMedia && (msg.type == MessageTypes.IMAGE || msg.type == MessageTypes.VIDEO || msg.type == MessageTypes.DOCUMENT)) {
          console.log('%s to sticker', msg.type)
          const media = await msg.downloadMedia()
          if(media.mimetype.startsWith('image') || media.mimetype.startsWith('video')){
            msg.reply(media, msg.id.remote, { sendMediaAsSticker: true, stickerName: "Created By", stickerAuthor: "CRazyzBOT"});
          }
      } else if(msg.hasMedia && msg.type == MessageTypes.STICKER){
          const media = await msg.downloadMedia()
          if(!msg.rawData?.isAnimated){
            const s = await sharp(Buffer.from(media.data, 'base64')).toFormat('png').toBuffer()
            msg.reply(new MessageMedia('image/png', s.toString('base64')), msg.id.remote, {sendMediaAsSticker:false})
          }
      } else {
          console.log(msg)
      }
  } catch (error) {
      console.error(error) 
  }
});

client.initialize();