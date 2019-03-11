import omit from 'lodash/omit';

import { mapSeriesAsync } from 'sistemium-telegram/services/async';
import { getId } from 'sistemium-telegram/services/redis';

import model from '../lib/schema';

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
  },
  statics: { merge },
});


async function merge(items) {

  const cts = new Date();

  const ops = await mapSeriesAsync(items, async item => {

    const $set = omit(item, ['id', 'ts', 'cts', 'refId']);

    const exists = await this.findOne({ id: item.id });

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

  return this.bulkWrite(ops, { ordered: false });

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
