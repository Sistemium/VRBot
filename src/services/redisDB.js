import * as redis from 'sistemium-telegram/services/redis';
import map from 'lodash/map';
import series from 'async/series';

export async function findAll(hashName) {
  return redis.hgetallAsync(hashName)
    .then(res => map(res, (data, id) => ({ id, ...JSON.parse(data) })));
}

export async function find(hashName, id) {
  return redis.hgetAsync(hashName, id)
    .then(res => ({ id, ...JSON.parse(res) }));
}

export async function save(hashName, id, data) {
  return redis.hsetAsync(hashName, id, JSON.stringify(data))
    .then(() => ({ ...data, id }));
}

export function saveMany(hashName, data) {

  return new Promise((resolve, reject) => {

    const tasks = data.map(item => done => save(hashName, item.id, item)
      .then(res => done(null, res))
      .catch(done));

    series(tasks, (err, res) => {

      if (err) {
        reject(err);
      } else {
        resolve(res);
      }

    });

  });

}
