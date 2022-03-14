import { Context } from 'telegraf';

import loggerVar from '../logger';

const error = async (ctx: Context, next: () => any) => {
  try {
    await next();
  } catch (err) {
    loggerVar.error(err);
    await ctx.reply('An internal error occurred');
  }
};

export default error;
