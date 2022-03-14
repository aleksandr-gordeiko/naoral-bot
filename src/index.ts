import { Telegraf } from 'telegraf';
import { connectDB, closeConnection } from './db';
import logger from './logger';

import error from './middlewares/error';
import processChannelPost from './processChannelPost';
import actionWhenAddedToChannel from './actionWhenAddedToChannel';
import { getImageHashFromURL, leven } from './extra';

const bot: Telegraf = new Telegraf(process.env.BOT_API_TOKEN);

bot.use(error);
bot.on('channel_post', processChannelPost);
bot.on('my_chat_member', actionWhenAddedToChannel);

let prevHash = '0';

bot.on('text', async (ctx) => {
  const newHash = await getImageHashFromURL(ctx.message.text);
  await ctx.reply(newHash);
  ctx.reply(`Dist: ${leven(newHash, prevHash)}`);
  prevHash = newHash;
});

process.once('SIGINT', () => {
  closeConnection()
    .then(() => logger.error('SIGINT occurred, exiting'))
    .catch(() => logger.error('SIGINT occurred, exiting with no db connection closed'));
});
process.once('SIGTERM', () => {
  closeConnection()
    .then(() => logger.error('SIGTERM occurred, exiting'))
    .catch(() => logger.error('SIGTERM occurred, exiting with no db connection closed'));
});

connectDB()
  .then(() => bot.launch())
  .then(() => logger.info('Bot started'))
  .catch((err) => logger.error(err));

// TODO disable listening while indexing
