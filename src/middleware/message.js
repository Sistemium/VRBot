import log from 'sistemium-telegram/services/log';
import filter from 'lodash/filter';
import escapeRegExp from 'lodash/escapeRegExp';
import sortBy from 'lodash/sortBy';

import { findAll } from '../services/redisDB';
import { countableState } from '../services/lang';

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

function displayFrame({ id, name }) {
  return `/f_${id} ${name}`;
}


async function searchFrames(text) {

  const frames = await findAll('frames');

  const re = new RegExp(escapeRegExp(text), 'i');
  const codeRe = new RegExp(`^${escapeRegExp(text)}`, 'i');

  return filter(frames, searcher);

  function searcher({ name, article, id }) {
    return codeRe.test(id) || codeRe.test(article) || re.test(name);
  }

}

const frameWords = {
  w1: 'рамку',
  w24: 'рамки',
  w50: 'рамок',
};

function frameCount(count) {

  return frameWords[countableState(count)];

}
