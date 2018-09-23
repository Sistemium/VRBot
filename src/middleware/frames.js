import log from 'sistemium-telegram/services/log';
import bot from 'sistemium-telegram/services/bot';
import escapeRegExp from 'lodash/escapeRegExp';
import map from 'lodash/map';
import trim from 'lodash/trim';
import filter from 'lodash/filter';
import axios from 'axios';
import xlsx from 'node-xlsx';

import importFrames from '../config/importFrames';
import * as redis from '../services/redisDB';
import { countableState } from '../services/lang';

const { debug } = log('frames');

export const FRAMES_KEY = 'frames';
export const PICTURES_KEY = 'pictures';

export const SHOW_ARTICLE_COMMAND = /^\/a_([x]?\d+)[ ]?([a-z]+)?/;

/**
 * Displays a frame info
 * @param {ContextMessageUpdate} ctx
 * @returns {Promise<void>}
 */

export async function showFrame(ctx) {

  const { match } = ctx;
  const [command, refId, format] = match;

  debug(command, refId, format);

  const frame = await redis.findByRefId(FRAMES_KEY, refId);

  if (!frame) {
    await ctx.replyWithHTML(`Не нашел товара с кодом <code>${refId}</code>`);
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

export function displayFrame({ refId, name }) {
  return `• /a_${refId} ${name}`;
}


export async function searchFrames(text) {

  const frames = await redis.findAll(FRAMES_KEY);

  const re = new RegExp(escapeRegExp(text), 'i');
  const codeRe = new RegExp(`^${escapeRegExp(text)}`, 'i');

  return filter(frames, searcher);

  function searcher({ name, article, id }) {
    return codeRe.test(id) || codeRe.test(article) || re.test(name);
  }

}

export function parseFramesFile(xls) {

  const sheet = xls[0].data;
  const [titles] = sheet;
  const sheetData = sheet.slice(1);

  const columns = importFrames.map(({ title, name, type }) => ({
    type, name, idx: titles.indexOf(title), title,
  }));

  const missing = filter(columns, { idx: -1 });

  if (missing.length) {
    throw new Error(`Не найдены колонки: [${map(missing, 'title').join(', ')}]`);
  }

  return sheetData.map(row => {

    const res = {};

    columns.forEach(({ name, idx, type }) => {
      const value = row[idx];
      res[name] = type ? value : trim(value).replace(/<>/, '');
    });

    return res;

  });

}

const frameWords = {
  w1: 'товар',
  w24: 'товара',
  w50: 'товаров',
};

export function frameCount(count) {

  return frameWords[countableState(count)];

}

export async function importImageFile(ctx, file) {

  const { file_name: name, thumb: { file_id: id }, file_id: largeId } = file;
  const [, article] = name.match(/(.+)\.png/);

  debug(name, article);

  const data = {
    largeId,
    thumbId: id,
    name,
    article,
  };

  await ctx.replyWithChatAction('upload_photo');

  const url = await bot.telegram.getFileLink(largeId);

  const { data: source } = await axios({
    method: 'get',
    responseType: 'arraybuffer',
    url,
    headers: {
      'Content-Type': file.mime_type,
    },
  });

  const msg = await bot.telegram.sendPhoto(ctx.message.chat.id, { source }, { caption: article });

  data.images = msg.photo;

  const picture = await redis.save(PICTURES_KEY, id, data);

  await ctx.reply(JSON.stringify(picture, null, 2));

}

export async function importFramesFromFile(ctx, fileId) {

  const url = await bot.telegram.getFileLink(fileId);
  const xls = await getFile(url);

  const data = parseFramesFile(xls);

  await redis.saveMany(FRAMES_KEY, data);

  await ctx.replyWithHTML(`Имрортировано <b>${data.length}</b> записей`);

}

async function getFile(url) {

  const response = await axios({
    method: 'get',
    responseType: 'arraybuffer',
    url,
    headers: {
      'Content-Type': 'application/x-msexcel',
    },
  });

  return xlsx.parse(response.data, { type: 'buffer' });

}
