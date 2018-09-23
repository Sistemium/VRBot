import log from 'sistemium-telegram/services/log';
import bot from 'sistemium-telegram/services/bot';

import axios from 'axios';
import xlsx from 'node-xlsx';
import map from 'lodash/map';
import * as db from '../services/redisDB';
import { FRAMES_KEY, parseFramesFile } from './frames';

const FILES_KEY = 'files';

const { debug } = log('document');

/**
 * Document upload handler
 * @param {ContextMessageUpdate} ctx
 * @returns {Promise<void>}
 */

export async function onDocument(ctx) {

  const { message: { document } } = ctx;
  const { file_id: fileId, file_name: name, mime_type: mime } = document;

  debug('onDocument', fileId);

  await ctx.replyWithHTML(`Получил файл <b>${name}</b>, попробую его изучить!`);
  const file = await db.save(FILES_KEY, fileId, document);

  switch (mime) {
    case 'application/x-msexcel':
      await importFramesFromFile(ctx, fileId);
      break;
    default:
      await ctx.replyWithHTML([
        `Не знаю как использовать файл типа <code>${mime}</code>`,
        `, но я его запомнил как ${fileKey(file)}`,
      ].join(''));
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

  const files = await db.findAll(FILES_KEY);

  if (!files) {
    await ctx.reply('Не помню, чтобы мне присылали какие-то файлы. Пришли что-нибудь и я запомню.');
    return;
  }

  const res = !param ? files.map(fileAsListItem).join('\n') : JSON.stringify(files, null, 2);

  await ctx.replyWithHTML(res);

}

function fileAsListItem(file) {
  return `${fileKey(file)} <b>${file.file_name}</b> <code>${file.mime_type}</code>`;
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

  const item = await db.findByRefId(FILES_KEY, refId);

  if (!item) {
    await ctx.replyWithHTML(`Не нашел файла с номером <code>${refId}</code>`);
    return;
  }

  if (format === 'plain') {
    await ctx.reply(`${JSON.stringify(item, null, 2)}`);
    return;
  }

  const reply = fileView(item);

  await ctx.replyWithHTML(reply.join('\n'));

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

async function importFramesFromFile(ctx, fileId) {

  await ctx.replyWithChatAction('typing');

  const url = await bot.telegram.getFileLink(fileId);
  const xls = await getFile(url);

  const data = parseFramesFile(xls);

  await db.saveMany(FRAMES_KEY, data);

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
