import log from 'sistemium-telegram/services/log';
import escapeRegExp from 'lodash/escapeRegExp';
import filter from 'lodash/filter';

import { findAll } from '../services/redisDB';
import { countableState } from '../services/lang';

const { debug } = log('message');

/**
 * Displays a frame info
 * @param {ContextMessageUpdate} ctx
 * @returns {Promise<void>}
 */

export async function showFrame(ctx) {

  const { message } = ctx;

  debug('onDocument', JSON.stringify(message));

}


export function displayFrame({ id, name }) {
  return `/f_${id} ${name}`;
}


export async function searchFrames(text) {

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

export function frameCount(count) {

  return frameWords[countableState(count)];

}
