import bot, { BOT_ID } from 'sistemium-telegram/services/bot';
import log from 'sistemium-telegram/services/log';
import session from 'sistemium-telegram/services/session';

const { error } = log('index');

bot.startPolling();

bot.use(exceptionHandler);
bot.use(session({ botId: BOT_ID })
  .middleware());

require('./commands');

/*
Exception handlers
*/

async function exceptionHandler(ctx, next) {

  try {
    await next();
  } catch ({ name, message }) {
    error('exceptionHandler', name, message);
    await ctx.replyWithHTML(`Ошибка: <b>${message}</b>`);
  }

}

bot.catch(({ name, message }) => {
  error(name, message);
});
