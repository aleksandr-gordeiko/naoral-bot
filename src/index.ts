import { Telegraf } from 'telegraf';
import { connectDB, closeConnection } from './db';

import error from './middlewares/error';
import processChannelPost from './processChannelPost';

const bot: Telegraf = new Telegraf(process.env.BOT_API_TOKEN);

bot.use(error);
bot.on('channel_post', processChannelPost);

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
