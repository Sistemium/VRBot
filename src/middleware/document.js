import log from 'sistemium-telegram/services/log';
import bot from 'sistemium-telegram/services/bot';
import axios from 'axios';
import xlsx from 'node-xlsx';
import trim from 'lodash/trim';
import map from 'lodash/map';
import filter from 'lodash/filter';
import importFrames from '../config/importFrames';
import { saveMany } from '../services/redisDB';
import { FRAMES_KEY } from './frames';

const { debug } = log('document');

/**
 * Document upload handler
 * @param {ContextMessageUpdate} ctx
 * @returns {Promise<void>}
 */

export async function onDocument(ctx) {

  const { message: { document: { file_id: fileId, file_name: name } } } = ctx;

  debug('onDocument', fileId);

  await ctx.replyWithHTML(`Получил файл <b>${name}</b>, попробую его изучить!`);

  await importFramesFromFile(ctx, fileId);

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

  await saveMany(FRAMES_KEY, data);

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


function parseFramesFile(xls) {

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
