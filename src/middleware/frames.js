import log from 'sistemium-telegram/services/log';
import escapeRegExp from 'lodash/escapeRegExp';
import filter from 'lodash/filter';

import { findAll, find } from '../services/redisDB';
import { countableState } from '../services/lang';

const { debug } = log('frames');

const FRAMES_KEY = 'frames';

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

  const reply = [displayFrame(frame)];

  await ctx.replyWithHTML(reply.join('\n'));

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
