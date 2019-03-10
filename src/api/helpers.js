import log from 'sistemium-telegram/services/log';
import pick from 'lodash/pick';

const { debug, error } = log('rest');

const PAGE_SIZE_HEADER = 'x-page-size';

export function getHandler(model) {

  return async ctx => {

    const { params: { id }, path } = ctx;

    debug('GET', path, id);

    try {

      ctx.body = await model.findOne({ id });

    } catch (err) {
      ctx.throw(500);
      error(err.name, err.message);
    }

  };
}

export function getManyHandler(model) {
  return async ctx => {

    const { header: { [PAGE_SIZE_HEADER]: pageSize = '10' }, path, query } = ctx;
    const filter = pick(query, Object.keys(model.schema.tree));

    debug('GET', path, filter);

    try {

      ctx.body = await model.find(filter).limit(parseInt(pageSize, 0));

    } catch (err) {
      ctx.throw(500);
      error(err.name, err.message);
    }

  };
}
