import log from 'sistemium-telegram/services/log';

import Markup from 'telegraf/markup';
import map from 'lodash/map';

import * as db from '../services/redisDB';
import * as models from '../services/models';
import { importFramesFromFile, importImageFile } from './frames';

const { debug } = log('document');

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

  const file = await db.save(models.FILES_KEY, fileId, document);

  switch (mime) {
    case 'application/x-msexcel':
      await importFramesFromFile(ctx, fileId);
      break;
    case 'image/png':
    case 'x-tiff':
      await importImageFile(ctx, file);
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

  const files = await db.findAll(models.FILES_KEY);

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

  const file = await db.find(models.FILES_KEY, fileId);

  await ctx.deleteMessage(callbackQuery.message_id);

  if (!file) {
    await ctx.answerCbQuery('Файл уже удален');
    return;
  }

  await db.destroy(models.FILES_KEY, fileId);

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

  const item = await db.findByRefId(models.FILES_KEY, refId);

  if (!item) {
    await ctx.replyWithHTML(`Не нашел файла с номером <code>${refId}</code>`);
    return;
  }

  if (format === 'plain') {
    await ctx.reply(`${JSON.stringify(item, null, 2)}`);
    return;
  }

  // const url = await bot.telegram.getFileLink(item.file_id);

  const reply = fileView(item);
  const keyBoard = Markup.inlineKeyboard([
    Markup.callbackButton('️Удалить', `deleteFile#${item.id}`),
    Markup.callbackButton('Скачать', `download#${item.file_id}`),
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
