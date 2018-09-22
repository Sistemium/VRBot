import log from 'sistemium-telegram/services/log';
import escapeRegExp from 'lodash/escapeRegExp';
import filter from 'lodash/filter';

import importFrames from '../config/importFrames';
import { findAll, find } from '../services/redisDB';
import { countableState } from '../services/lang';

const { debug } = log('frames');

export const FRAMES_KEY = 'frames';

export const SHOW_ARTICLE_COMMAND = /^\/a_([x]?\d+)[ ]?([a-z]+)?/;

/**
 * Displays a frame info
 * @param {ContextMessageUpdate} ctx
 * @returns {Promise<void>}
 */

export async function showFrame(ctx) {

  const { match } = ctx;
  const [command, frameId, format] = match;

  debug(command, frameId, format);

  const frame = await find(FRAMES_KEY, frameId);

  if (!frame) {
    await ctx.replyWithHTML(`Не нашел товара с кодом <code>${frameId}</code>`);
    return;
  }

  if (format === 'plain') {
    await ctx.reply(`${JSON.stringify(frame, null, 2)}`);
    return;
  }

  const reply = frameView(frame);

  await ctx.replyWithHTML(reply.join('\n'));

}

function frameView(frame) {

  const res = importFrames.map(({ title, name }) => {

    if (name === 'name') {
      return false;
    }

    const value = frame[name];

    return value && `${title}: <code>${value}</code>`;

  });

  return [
    `<b>${frame.name}</b>\n`,
    ...filter(res),
  ];

}

export function displayFrame({ id, name }) {
  return `• /a_${id} ${name}`;
}


export async function searchFrames(text) {

  const frames = await findAll(FRAMES_KEY);

  const re = new RegExp(escapeRegExp(text), 'i');
  const codeRe = new RegExp(`^${escapeRegExp(text)}`, 'i');

  return filter(frames, searcher);

  function searcher({ name, article, id }) {
    return codeRe.test(id) || codeRe.test(article) || re.test(name);
  }

}

const frameWords = {
  w1: 'товар',
  w24: 'товара',
  w50: 'товаров',
};

export function frameCount(count) {

  return frameWords[countableState(count)];

}
