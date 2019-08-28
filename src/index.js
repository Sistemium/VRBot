import bot, { BOT_ID } from 'sistemium-telegram/services/bot';
import log from 'sistemium-telegram/services/log';
import session from 'sistemium-telegram/services/session';
import 'sistemium-telegram/config/aws';

import * as mongo from './lib/mongo';
import NotifySaleOrder from './notify/NotifySaleOrder';

const { error } = log('index');

main().catch(error);

async function main() {

  await mongo.connect();
  await bot.startPolling();

  bot.use(exceptionHandler);
  bot.use(session({ botId: BOT_ID })
    .middleware());

  const notifySaleOrder = new NotifySaleOrder();

  await notifySaleOrder.init();

}

require('./commands');

/*
Exception handlers
*/

async function exceptionHandler(ctx, next) {

  try {
    await next();
  } catch ({ message, stack }) {
    error('exceptionHandler', stack);
    await ctx.replyWithHTML(`Ошибка: <b>${message}</b>`);
  }

}

bot.catch(({ name, stack }) => {
  error(name, stack);
});
