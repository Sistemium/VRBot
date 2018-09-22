import log from 'sistemium-telegram/services/log';
import escapeRegExp from 'lodash/escapeRegExp';
import filter from 'lodash/filter';

import importFrames from '../config/importFrames';
import { findAll, find } from '../services/redisDB';
import { countableState } from '../services/lang';

const { debug } = log('frames');

export const FRAMES_KEY = 'frames';

/**
 * Displays a frame info
 * @param {ContextMessageUpdate} ctx
 * @returns {Promise<void>}
 */

export async function showFrame(ctx) {

  const { match } = ctx;
  const [command, frameId] = match;

  debug(command, frameId);

  const frame = await find(FRAMES_KEY, frameId);

  if (!frame) {
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
  return `/f_${id} ${name}`;
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
  w1: 'рамку',
  w24: 'рамки',
  w50: 'рамок',
};

export function frameCount(count) {

  return frameWords[countableState(count)];

}
