import filter from 'lodash/filter';
import map from 'lodash/map';
import trim from 'lodash/trim';
import log from 'sistemium-telegram/services/log';

import config from '../config/importStock';

const { debug } = log('stock');

export default function parseStockFile(sheet) {

  const titles = sheet.data[config.titlesRow];

  debug(titles.length);

  const columns = config.columns.map(({ title, name, type }) => ({
    type, name, idx: titles.indexOf(title), title,
  }));

  const missing = filter(columns, { idx: -1 });

  if (missing.length) {
    throw new Error(`Не найдены колонки: [${map(missing, 'title').join(', ')}]`);
  }

  const sheetData = filter(sheet.data, ({ length }) => length === config.columns.length);

  debug(sheetData.length);

  return sheetData.map(row => {

    const res = {};

    columns.forEach(({ name, idx, type }) => {
      const value = row[idx];
      res[name] = type ? value : trim(value).replace(/<>/, '');
    });

    return res;

  });

}
