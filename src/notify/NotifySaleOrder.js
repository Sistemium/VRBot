import log from 'sistemium-telegram/services/log';
import { eachSeriesAsync } from 'sistemium-telegram/services/async';
import bot from 'sistemium-telegram/services/bot';

import Chat from '../models/Chat';
import SaleOrder from '../models/SaleOrder';
import * as so from '../services/saleOrders';

const { debug, error } = log('NotifySaleOrder');

export default class NotifySaleOrder {

  async init() {

    const chats = await chatsToNotify();

    debug('init', chats.length);

    this.watch = SaleOrder.watch()
      .on('change', ({ operationType, fullDocument }) => {
        debug(operationType);
        return operationType === 'insert' && onCreate(fullDocument).catch(error);
      });

  }

}

function chatsToNotify() {
  return Chat.find({ 'setting.notifySaleOrder': true });
}

async function onCreate(saleOrder) {

  debug('onCreate', saleOrder);

  const msg = so.saleOrderView(saleOrder);
  const chats = await chatsToNotify();

  debug('onCreate', chats.length);

  await eachSeriesAsync(chats, async chat => {
    await notify(chat.id, `Поступил новый ${msg}`);
  });

}

async function notify(userId, msg) {
  debug('notify', userId, msg.length);
  const options = { parse_mode: 'HTML', disable_notification: true, disable_web_page_preview: true };
  return bot.telegram.sendMessage(userId, msg, options);
}
