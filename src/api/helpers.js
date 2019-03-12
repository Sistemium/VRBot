import log from 'sistemium-telegram/services/log';
import pick from 'lodash/pick';
import mapValues from 'lodash/mapValues';

const { debug, error } = log('rest');

const PAGE_SIZE_HEADER = 'x-page-size';

export function getHandler(model) {

  return async ctx => {

    const { params: { id }, path } = ctx;

    debug('GET', path, id);

    try {

      ctx.body = await model.findOne({ id });

    } catch (err) {
      error(err.name, err.message);
      ctx.throw(500);
    }

  };
}

export function getManyHandler(model) {
  return async ctx => {

    const { header: { [PAGE_SIZE_HEADER]: pageSize = '10' }, path, query } = ctx;
    const filters = mapValues(pick(query, Object.keys(model.schema.tree)), x => x || null);

    debug('GET', path, filters);

    try {

      ctx.body = await model.find(filters).limit(parseInt(pageSize, 0));

    } catch (err) {
      error(err.name, err.message);
      ctx.throw(500);
    }

  };
}
