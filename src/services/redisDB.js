import * as redis from 'sistemium-telegram/services/redis';
import map from 'lodash/map';
import eachSeries from 'async/eachSeries';

export const { getId } = redis;

export async function findAll(hashName) {
  const res = await redis.hgetallAsync(hashName);
  return res && map(res, JSON.parse);
}

export async function find(hashName, id) {
  const res = await redis.hgetAsync(hashName, id);
  return res && JSON.parse(res);
}

export async function save(hashName, id, data) {
  const record = { ...data, id, ts: now() };
  await redis.hsetAsync(hashName, id, JSON.stringify(record));
  return record;
}

export function saveMany(hashName, data) {
  return eachSeries(data, async item => save(hashName, item.id, item));
}

function now() {
  return new Date().toISOString();
}
