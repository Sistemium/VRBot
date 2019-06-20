import omit from 'lodash/omit';
import map from 'lodash/map';
import keyBy from 'lodash/keyBy';
import log from 'sistemium-telegram/services/log';

import { mapSeriesAsync } from 'sistemium-telegram/services/async';
import { getId } from 'sistemium-telegram/services/redis';

import model from '../lib/schema';

const { debug } = log('Frame');
const FRAMES_KEY = 'frames';

export default model({
  collection: 'Frame',
  schema: {
    id: String,
    refId: Number,
    article: String,
    name: String,
    parent: String,
    size: String,
    packageRel: Number,
    weight: Number,
    material: String,
    screen: String,
    back: String,
    ts: Date,
    cts: Date,

    stock: Number,
    sales: Number,

  },
  statics: { merge },
});


async function merge(items) {

  const cts = new Date();

  const pipeline = [{ $match: { id: { $in: map(items, 'id') } } }];

  const existing = await this.aggregate(pipeline).project({ id: 1, refId: 1 });
  const existingKeys = keyBy(existing, 'id');

  debug('found:', existing.length);

  const ops = await mapSeriesAsync(items, async item => {

    const $set = omit(item, ['id', 'ts', 'cts', 'refId']);

    const exists = existingKeys[item.id];

    const refId = exists ? exists.refId : await getId(FRAMES_KEY);

    return {
      updateOne: {
        filter: { id: item.id },
        update: {
          $set,
          $currentDate: { ts: true },
          $setOnInsert: { cts, refId },
        },
        upsert: true,
      },
    };

  });

  debug('ops:', ops.length);

  const res = await this.bulkWrite(ops, { ordered: false });

  const { nUpserted = 0, nModified = 0 } = res.result;

  debug('done:', nUpserted, '+', nModified);

  return res;

}

/*

    "id" : "50020",
    "refId" : 1088,
    "article" : "281РП2130",
    "name" : "Рамка пластиковая  21*30  281 молоко  /25/  L20",
    "parent" : "Багет 200-я серия",
    "size" : "",
    "packageRel" : 25,
    "weight" : 0.468,
    "material" : "Пластик",
    "screen" : "",
    "back" : "",
    "ts" : "2018-09-29T08:34:45.941Z"

 */
