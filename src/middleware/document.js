import log from 'sistemium-telegram/services/log';
import bot from 'sistemium-telegram/services/bot';
import axios from 'axios';
import xlsx from 'node-xlsx';
import trim from 'lodash/trim';
import map from 'lodash/map';
import filter from 'lodash/filter';
import importFrames from '../config/importFrames';
import { saveMany } from '../services/redisDB';

const { debug } = log('document');

/**
 * Document upload handler
 * @param {ContextMessageUpdate} ctx
 * @returns {Promise<void>}
 */

export async function onDocument(ctx) {

  const { message } = ctx;

  debug('onDocument', JSON.stringify(message));

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

  await ctx.replyWithChatAction('typing');

  const url = await bot.telegram.getFileLink(fileId);
  const xls = await getFile(url);

  const data = parseFramesFile(xls);

  await saveMany('frames', data);

  await ctx.replyWithHTML(`Имрортировано <b>${data.length}</b> строк`);
  await ctx.replyWithHTML(`<pre>${JSON.stringify(data[0], null, 2)}</pre>`);

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
      res[name] = type ? value : trim(value);
    });

    return res;

  });

}
