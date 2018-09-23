import * as redis from 'sistemium-telegram/services/redis';
import map from 'lodash/map';
import eachSeries from 'async/eachSeries';

export const { getId } = redis;

export async function findAll(hashName) {
  const res = await redis.hgetallAsync(hashName);
  return res && map(res, JSON.parse);
}

export async function destroy(hashName, id) {
  return redis.hdelAsync(hashName, id);
}

export async function find(hashName, id) {
  const res = await redis.hgetAsync(hashName, id);
  return res && JSON.parse(res);
}

export async function findByRefId(hashName, refId) {
  const id = await redis.hgetAsync(refKey(hashName), refId);
  return find(hashName, id);
}

export async function save(hashName, id, data) {

  const refId = data.refId || await getId(hashName);

  const record = {
    refId,
    ...data,
    id,
    ts: now(),
  };

  await redis.hsetAsync(hashName, id, JSON.stringify(record));

  if (!data.refId) {
    await redis.hsetAsync(refKey(hashName), refId, id);
  }

  return record;

}

export function saveMany(hashName, data) {
  return eachSeries(data, async item => save(hashName, item.id, item));
}

/*
Private
 */

function refKey(hashName) {
  return `${hashName}_refId`;
}

function now() {
  return new Date().toISOString();
}
