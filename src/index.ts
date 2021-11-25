import get from 'axios';
import { Telegraf } from 'telegraf';
import { connectDB, closeConnection } from './db';

import error from './middlewares/error';
import processChannelPost from './processChannelPost';
import actionWhenAddedToChannel from './actionWhenAddedToChannel';
import { leven } from './extra';

const imghash = require('imghash');

const bot: Telegraf = new Telegraf(process.env.BOT_API_TOKEN);

bot.use(error);
bot.on('channel_post', processChannelPost);
bot.on('my_chat_member', actionWhenAddedToChannel);

let prevHash = 'a';

bot.on('message', async (ctx) => {
  // @ts-ignore
  get(ctx.message.text, {
    responseType: 'arraybuffer',
  })
    .then(async (response) => {
      const newHash = await imghash.hash(Buffer.from(response.data, 'binary'), 16, 'binary');
      await ctx.reply(newHash);
      ctx.reply(`DIst: ${leven(newHash, prevHash)}`);
      prevHash = newHash;
    });
});

process.once('SIGINT', () => {
  closeConnection()
    .then(() => console.log('SIGINT occurred, exiting'))
    .catch(() => console.log('SIGINT occurred, exiting with no db connection closed'));
});
process.once('SIGTERM', () => {
  closeConnection()
    .then(() => console.log('SIGTERM occurred, exiting'))
    .catch(() => console.log('SIGTERM occurred, exiting with no db connection closed'));
});

connectDB()
  .then(() => bot.launch())
  .catch((err) => console.log(err));
