import log from 'sistemium-telegram/services/log';
import sortBy from 'lodash/sortBy';
import findIndex from 'lodash/findIndex';
import slice from 'lodash/slice';

import Markup from 'telegraf/markup';

import { displayFrame, frameCount, searchFrames } from './frames';

const { debug } = log('message');

const PAGE_SIZE = 10;

export async function onMessage(ctx) {

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

  const { reply, keyboard } = await framesPageReply(text);

  await ctx.replyWithHTML(reply.join('\n'), keyboard.extra());

}

/**
 * Action handler to forward a list to the next page
 * @param {ContextMessageUpdate} ctx
 * @returns {Promise<void>}
 */

export async function pageForward(ctx) {

  const { match, callbackQuery } = ctx;
  const [action, direction, pageId] = match;

  debug(action, direction, pageId, callbackQuery.message.message_id);

  const { reply, keyboard } = await framesPageReply('сосна', direction, pageId);

  await ctx.replyWithHTML(reply.join('\n'), keyboard.extra());

}

async function framesPageReply(search, direction, fromPageId) {

  const matching = sortBy(await searchFrames(search), 'name');

  const { length } = matching;

  if (!length) {
    throw new Error('Не нашел подходящих товаров');
  }

  let startIndex = 0;

  if (fromPageId) {
    const pageIndex = findIndex(matching, ({ id }) => id === fromPageId);
    startIndex = pageIndex + (direction === 'forward' ? PAGE_SIZE : -PAGE_SIZE);
    debug('startIndex:', pageIndex, startIndex);
  }

  const reply = [
    `По запросу <b>${search}</b> нашлось ${length} ${frameCount(length)}:`,
  ];

  const lastIndex = startIndex + PAGE_SIZE - 1;

  const toShow = slice(matching, startIndex, lastIndex + 1);

  if (!toShow.length) {
    throw new Error('Не нашлось данных при поиске следующей страницы');
  }

  if (toShow.length < length) {
    reply.push([
      `Вот <b>${!startIndex ? 'первые' : `c ${startIndex + 1} по`}</b>`,
      `<b>${lastIndex + 1}</b>:\n`,
    ].join(' '));
  }

  reply.push(...toShow.map(displayFrame));

  const [{ id: pageId }] = toShow;

  debug('framesPageReply pageId:', pageId);

  const keyboard = Markup.inlineKeyboard([
    Markup.callbackButton(
      `Предыдущие ${PAGE_SIZE}`,
      `page_back#${pageId}`,
      startIndex === 0,
    ),
    Markup.callbackButton(
      `Следующие ${PAGE_SIZE}`,
      `page_forward#${pageId}`,
      length <= lastIndex,
    ),
  ]);

  return { reply, keyboard };

}
