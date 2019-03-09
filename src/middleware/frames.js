import log from 'sistemium-telegram/services/log';
import bot from 'sistemium-telegram/services/bot';

import escapeRegExp from 'lodash/escapeRegExp';
import map from 'lodash/map';
import trim from 'lodash/trim';
import filter from 'lodash/filter';

import importFrames from '../config/importFrames';
import * as imaging from '../services/imaging';
import { countableState } from '../services/lang';

import Picture from '../models/Picture';
import Frame from '../models/Frame';

const { debug } = log('frames');

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

  const frame = await Frame.findOne({ refId });

  if (!frame) {
    await ctx.replyWithHTML(`Не нашел товара с кодом <code>${refId}</code>`);
    return;
  }

  if (format === 'plain') {
    await ctx.reply(`${JSON.stringify(frame, null, 2)}`);
    return;
  }

  const reply = frameView(frame);

  const picturesFilter = matchesArticle();

  const matching = picturesFilter ? await Picture.find(picturesFilter) : [];

  if (!matching.length) {
    reply.push('\nПодходящих картинок не нашел');
  } else {
    reply.push(matching.map(listPhotos).join(' '));
  }

  await ctx.replyWithHTML(reply.join('\n'));

  const mediaGroup = map(matching, ({ images }) => ({
    media: images[0].file_id,
    type: 'photo',
  }));

  if (mediaGroup.length) {
    await ctx.replyWithMediaGroup(mediaGroup);
  }

  function matchesArticle() {
    if (!frame.article) {
      return false;
    }
    const [, bgArticle] = frame.article.match(/(.+)(РД|РП)\d+/i) || [];
    return { article: { $in: [frame.article, bgArticle] } };
  }

  function listPhotos(photo) {
    return `/p_${photo.refId}`;
  }

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

  const re = new RegExp(escapeRegExp(text), 'i');
  const codeRe = new RegExp(`^${escapeRegExp(text)}`, 'i');

  debug('searchFrames', re);

  return Frame.find().or([
    { id: { $regex: codeRe } },
    { article: { $regex: codeRe } },
    { name: { $regex: re } },
  ]);

  // function searcher({ name, article, id }) {
  //   return codeRe.test(id) || codeRe.test(article) || re.test(name);
  // }

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

export async function importPhoto(ctx) {

  const { match } = ctx;
  const [command, refId] = match;

  debug(command, refId);

  if (!refId) {
    throw new Error('Не указан номер файла');
  }

  const file = await Frame.findOne({ refId });

  if (!file) {
    throw new Error(`Не нашел файла с номером ${refId}`);
  }

  await importImageFile(ctx, file);

}

export async function importImageFile(ctx, file) {

  const {
    file_name: name,
    thumb: { file_id: thumbId },
    file_id: largeId,
    mime_type: mimeType,
  } = file;

  debug(name, mimeType);

  const data = {
    largeId,
    thumbId,
    name,
  };

  await ctx.replyWithChatAction('upload_photo');

  debug('importImageFile:', largeId);
  const url = await bot.telegram.getFileLink(largeId);
  debug('importImageFile:', url);

  const source = await imaging.getImageBuffer(url, mimeType);

  await imaging.saveImageBuffer(ctx, source, thumbId, data);

}

export async function importFramesFromFile(ctx, xls) {

  const data = parseFramesFile(xls);

  await Frame.merge(data);

  await ctx.replyWithHTML(`Имрортировано <b>${data.length}</b> записей`);

}
