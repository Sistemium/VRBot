import log from 'sistemium-telegram/services/log';
import pick from 'lodash/pick';
import map from 'lodash/map';
import filter from 'lodash/filter';
import isObject from 'lodash/isObject';
import mapValues from 'lodash/mapValues';
import uuid from 'uuid/v4';

const { debug, error } = log('rest');

const PAGE_SIZE_HEADER = 'x-page-size';

export function getHandler(model) {

  return async ctx => {

    const { params: { id }, path } = ctx;

    debug('GET', path, id);

    try {

      ctx.body = await model.findOne({ id, isDeleted: { $ne: true } });

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

    let { request: { body } } = ctx;

    if (!Array.isArray(body)) {
      body = [body];
    }

    debug('POST', ctx.path, body.length, 'records');

    try {

      ctx.body = await model.merge(body);

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


const UPSERT = { upsert: true, new: true };

export function putHandler(model) {
  return async ctx => {

    const { request: { body }, path, params } = ctx;

    ctx.assert(isObject(body), 400, 'Body must be an object');

    if (!body.id) {
      const { id = uuid() } = params;
      body.id = id;
    }

    debug('PUT', path, body);

    try {

      const query = { id: body.id };

      ctx.body = await model.findOneAndUpdate(query, body, UPSERT);

    } catch (e) {
      const { writeErrors } = e;
      if (writeErrors && writeErrors.length) {
        error('writeErrors[0]:', JSON.stringify(writeErrors[0]));
      }
      ctx.throw(500, e);
    }

  };
}
