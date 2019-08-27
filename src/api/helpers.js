import log from 'sistemium-telegram/services/log';
import pick from 'lodash/pick';
import map from 'lodash/map';
import filter from 'lodash/filter';
import mapValues from 'lodash/mapValues';

const { debug, error } = log('rest');

const PAGE_SIZE_HEADER = 'x-page-size';

export function getHandler(model) {

  return async ctx => {

    const { params: { id }, path } = ctx;

    debug('GET', path, id);

    try {

      ctx.body = await model.findOne({ id, isDeleted: { $ne: true } });
      if (!ctx.body) {
        ctx.status = 404;
      }

    } catch (err) {
      error(err.name, err.message);
      ctx.throw(500);
    }

  };

}

export function getManyHandler(model) {
  return async ctx => {

    const { path, query, header } = ctx;
    const filters = mapValues(pick(query, Object.keys(model.schema.tree)), x => x || null);

    let { [`${PAGE_SIZE_HEADER}:`]: pageSize } = query;

    debug('GET', path, filters);

    if (!pageSize) {
      pageSize = header[PAGE_SIZE_HEADER] || '10';
    }

    if (!filters.isDeleted) {
      filters.isDeleted = { $ne: true };
    }

    try {

      const predicateFilter = checkPredicates(ctx, model.predicates);

      debug('getManyHandler:filters', predicateFilter);

      const modelQuery = model.find(filters);

      predicateFilter.forEach(f => modelQuery.where(f));

      ctx.body = await modelQuery.limit(parseInt(pageSize, 0));

    } catch (err) {
      error(err.name, err.message);
      ctx.throw(500);
    }

  };
}

function checkPredicates(ctx, predicates) {

  return filter(map(predicates, predicate => predicate(ctx)));

}

export function postHandler(model) {
  return async ctx => {

    const { request: { body }, params: { id } } = ctx;

    const wasArray = Array.isArray(body);

    ctx.assert(!wasArray || !id, 400, 'Can not post array with id');

    if (id) {
      body.id = id;
    }

    const data = wasArray ? body : [body];

    debug('POST', ctx.path, body.length, 'records');

    try {

      const res = await model.merge(data);

      ctx.body = wasArray ? res : res[0];

    } catch (e) {
      const { writeErrors } = e;
      if (writeErrors && writeErrors.length) {
        error('writeErrors[0]:', JSON.stringify(writeErrors[0]));
      }
      ctx.throw(500, e);
    }

  };
}

export function delHandler(model) {

  return async ctx => {

    const { path, params: { id } } = ctx;

    ctx.assert(id, 400, 'Need an ID to perform DELETE');

    debug('DELETE', path);

    try {

      const query = { id };

      ctx.body = await model.findOneAndUpdate(query, { isDeleted: true });

    } catch (e) {
      const { writeErrors } = e;
      if (writeErrors && writeErrors.length) {
        error('writeErrors[0]:', JSON.stringify(writeErrors[0]));
      }
      ctx.throw(500, e);
    }

  };
}
