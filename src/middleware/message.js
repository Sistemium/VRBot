import log from 'sistemium-telegram/services/log';
import sortBy from 'lodash/sortBy';
import { displayFrame, frameCount, searchFrames } from './frames';

const { debug } = log('message');

export default async function (ctx) {

  const {
    message: { text, message_id: messageId },
    chat: { id: chatId },
    from: { id: fromId },
  } = ctx;

  if (chatId !== fromId) {
    debug('ignore chat message', chatId, text);
    return;
  }

  debug(`#${messageId}`, text || 'not a text message');

  if (!text) {
    await ctx.reply(process.env.PHRASE_NOT_IMPLEMENTED);
    return;
  }

  const matching = await searchFrames(text);
  const { length } = matching;

  if (!length) {
    await ctx.reply('Не нашел подходящих рамок');
    return;
  }

  await ctx.reply(`Нашел ${length} ${frameCount(length)}:`);

  const toShow = sortBy(matching, 'name').slice(0, 10);

  const reply = toShow.map(displayFrame);

  if (toShow.length < length) {
    reply.splice(0, 0, `Вот первые ${toShow.length}:\n`);
  }

  await ctx.reply(reply.join('\n'));

}
