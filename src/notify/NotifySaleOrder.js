import log from 'sistemium-telegram/services/log';
import { eachSeriesAsync } from 'sistemium-telegram/services/async';
import bot from 'sistemium-telegram/services/bot';
import { SQS } from 'aws-sdk';

import Chat from '../models/Chat';
import SaleOrder from '../models/SaleOrder';
import * as so from '../services/saleOrders';

const { debug, error } = log('NotifySaleOrder');

const { SQS_MAILER_QUEUE_URL } = process.env;

export default class NotifySaleOrder {

  async init() {

    const chats = await chatsToNotify();

    debug('init', chats.length);

    this.watch = SaleOrder.watch()
      .on('change', ({ operationType, fullDocument }) => {
        debug(operationType);
        return operationType === 'insert' && this.onCreate(fullDocument).catch(error);
      });

    if (SQS_MAILER_QUEUE_URL) {
      debug('init SQS:', SQS_MAILER_QUEUE_URL);
      this.sqs = new SQS({ region: 'eu-west-1' });
    } else {
      debug('SQS_MAILER_QUEUE_URL is empty');
    }

  }

  async onCreate(saleOrder) {

    debug('onCreate', saleOrder);

    const msg = so.saleOrderView(saleOrder);
    const chats = await chatsToNotify();

    debug('onCreate', chats.length);

    await eachSeriesAsync(chats, async chat => {
      await notify(chat.id, `Поступил новый ${msg}`);
    });

    await this.sendSQS(saleOrder);

  }

  async sendSQS({ id }) {

    if (!this.sqs) {
      return;
    }

    const msg = await this.sqs.sendMessage({
      DelaySeconds: 0,
      MessageBody: `vrSaleOrderNew/${id}`,
      QueueUrl: SQS_MAILER_QUEUE_URL,
    });

    await msg.send();

    debug('sendSQS', id);

  }

}

function chatsToNotify() {
  return Chat.find({ 'setting.notifySaleOrder': true });
}

async function notify(userId, msg) {
  debug('notify', userId, msg.length);
  const options = { parse_mode: 'HTML', disable_notification: true, disable_web_page_preview: true };
  return bot.telegram.sendMessage(userId, msg, options);
}
