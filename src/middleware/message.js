import log from 'sistemium-telegram/services/log';

const { debug } = log('message');

export default async function (ctx) {

  const {
    message,
    chat: { id: chatId },
    from: { id: fromId },
  } = ctx;

  if (chatId !== fromId) {
    debug('ignore chat message', chatId, message.text);
    return;
  }

  debug(`#${message.message_id}`, message.text || 'not a text message');

  await ctx.reply(process.env.PHRASE_NOT_IMPLEMENTED);

}
