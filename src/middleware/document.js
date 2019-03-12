import log from 'sistemium-telegram/services/log';

import Markup from 'telegraf/markup';
import map from 'lodash/map';
import bot from 'sistemium-telegram/services/bot';
import axios from 'axios';
import xlsx from 'node-xlsx';

import File from '../models/File';

import parseStockFile from '../services/stock';

import { importFramesFromFile, importImageFile } from './frames';

const { debug } = log('document');

const XLS_TYPE_FRAMES = 'XLS_TYPE_FRAMES';
const XLS_TYPE_STOCK = 'XLS_TYPE_STOCK';
const stockRe = /Остатки товаров на складах/;

/**
 * Document upload handler
 * @param {ContextMessageUpdate} ctx
 * @returns {Promise<void>}
 */

export async function onDocument(ctx) {

  const { message: { document } } = ctx;
  const { file_name: name, mime_type: mime, thumb } = document;

  const fileId = thumb ? thumb.file_id : document.file_id;

  debug('onDocument', fileId);

  await ctx.replyWithHTML(`Получил файл <b>${name}</b>, попробую его изучить!`);
  await ctx.replyWithChatAction('typing');

  const file = await new File({ id: fileId, ...document }).save();

  switch (mime) {
    case 'application/x-msexcel':
      await importXLS(ctx, fileId);
      break;
    case 'image/png':
    case 'image/x-tiff':
      await importImageFile(ctx, file);
      break;
    default:
      await ctx.replyWithHTML([
        `Не знаю как использовать файл типа <code>${mime}</code>`,
        `, но я его запомнил как ${fileKey(file)}`,
      ].join(''));
  }


}


function detectFileType(xls) {

  const sheet = xls[0].data;
  const [titles] = sheet;

  if (stockRe.test(titles[0])) {
    return XLS_TYPE_STOCK;
  }

  return XLS_TYPE_FRAMES;

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


async function importXLS(ctx, fileId) {

  const url = await bot.telegram.getFileLink(fileId);
  const xls = await getFile(url);

  switch (detectFileType(xls)) {

    case XLS_TYPE_FRAMES: {
      return importFramesFromFile(ctx, xls);
    }

    case XLS_TYPE_STOCK: {
      const stock = parseStockFile(xls[0]);
      return ctx.replyWithHTML(`Импортировано <b>${stock.length}</b>`);
    }

    default: {
      return ctx.replyWithHTML('Не удалось распознать содержимое файла');
    }

  }

}


export const SHOW_FILE_COMMAND = /^\/f_([x]?\d+)[ ]?([a-z]+)?/;

function fileKey({ refId }) {
  return `/f_${refId}`;
}

/**
 * Show uploaded files
 * @param {ContextMessageUpdate} ctx
 * @returns {Promise<void>}
 */

export async function listFiles(ctx) {

  const { match = [ctx.message.text] } = ctx;
  const [command, param] = match;

  debug(command, param);

  const files = await File.find();

  if (!files) {
    const reply = 'Не помню, чтобы мне присылали какие-то файлы. Пришли что-нибудь и я запомню.';
    await ctx.reply(reply);
    return;
  }

  const res = !param ? files.map(fileAsListItem).join('\n') : JSON.stringify(files, null, 2);

  await ctx.replyWithHTML(res);

}

function fileAsListItem(file) {
  return `${fileKey(file)} <b>${file.file_name}</b> <code>${file.mime_type}</code>`;
}

/**
 * Action handler to show a file download link
 * @param {ContextMessageUpdate} ctx
 * @returns {Promise<void>}
 */

export async function downloadFile(ctx) {

  const { match } = ctx;
  const [action, fileId] = match;

  debug(action, fileId);

  await ctx.replyWithDocument(fileId);

}

/**
 * Action handler to delete a file
 * @param {ContextMessageUpdate} ctx
 * @returns {Promise<void>}
 */

export async function deleteFile(ctx) {

  const { match, callbackQuery } = ctx;
  const [action, fileId] = match;

  debug(action, fileId);
  // debug(JSON.stringify(callbackQuery));

  const file = await File.findOne({ id: fileId });

  await ctx.deleteMessage(callbackQuery.message_id);

  if (!file) {
    await ctx.answerCbQuery('Файл уже удален');
    return;
  }

  await file.delete();

  await ctx.replyWithHTML(`Удалил файл №${file.refId} <b>${file.file_name}</b>`);

}

/**
 * Show a file info
 * @param {ContextMessageUpdate} ctx
 * @returns {Promise<void>}
 */

export async function showFile(ctx) {

  const { match } = ctx;
  const [command, refId, format] = match;

  debug(command, refId, format);

  const item = await File.findOne({ refId });

  if (!item) {
    await ctx.replyWithHTML(`Не нашел файла с номером <code>${refId}</code>`);
    return;
  }

  if (format === 'plain') {
    await ctx.reply(`${JSON.stringify(item.toObject(), null, 2)}`);
    return;
  }

  // const url = await bot.telegram.getFileLink(item.file_id);

  const reply = fileView(item.toObject());
  const keyBoard = Markup.inlineKeyboard([
    Markup.callbackButton('️Удалить', `deleteFile#${item.id}`),
    Markup.callbackButton('Скачать', `downloadFile#${item.file_id}`),
  ]);

  // debug(JSON.stringify(keyBoard));

  await ctx.replyWithHTML(reply.join('\n'), keyBoard.extra());

}

function fileView(file) {
  return map(file, (val, key) => `${key}: <code>${JSON.stringify(val)}</code>`);
}

/**
 * Get file info test command
 * @param {ContextMessageUpdate} ctx
 * @returns {Promise<void>}
 */

export async function onGetFile(ctx) {

  const { message: { text } } = ctx;

  const [, fileId] = text.match(/[ ](.+)$/);

  debug('onGetFile', fileId);

  await importFramesFromFile(ctx, fileId);

}
