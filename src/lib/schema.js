import { Schema, model } from 'mongoose';
import each from 'lodash/each';
import omit from 'lodash/omit';
import pick from 'lodash/pick';
import isFunction from 'lodash/isFunction';
import uuid from 'uuid/v4';
import { mapSeriesAsync } from 'sistemium-telegram/services/async';
// import log from 'sistemium-telegram/services/log';

// const { debug } = log('schema');

export default function (config) {

  const {
    collection,
    schema: schemaConfig,
    statics = {},
    indexes = [],
    onSchema,
    predicates,
    mergeBy = ['id'],
  } = config;

  Object.assign(schemaConfig, {
    ts: Date,
    id: String,
    cts: Date,
    isDeleted: {
      type: Boolean,
      default: false,
    },
  });

  const schema = new Schema(schemaConfig, { collection });

  if (isFunction(onSchema)) {
    onSchema(schema);
  }

  /* eslint-disable no-param-reassign */
  /* eslint-disable no-underscore-dangle */

  schema.set('toJSON', {
    virtuals: true,
    transform(doc, ret) {
      delete ret._id;
      delete ret.__v;
      delete ret.isDeleted;
    },
  });

  if (predicates) {
    statics.predicates = predicates;
  }

  schema.statics = Object.assign({ merge, mergeBy }, statics);

  indexes.push({ ts: -1 });
  indexes.push({ id: 1 });

  each(indexes, index => schema.index(index));

  return model(collection, schema);

}


/**
 * Merges an array of collection data into the model
 * @param {Array} items
 * @returns {Promise}
 */
export async function merge(items) {

  const cts = new Date();
  const { mergeBy } = this;
  const toOmit = ['ts', 'cts', ...mergeBy];

  const ids = [];

  const ops = await mapSeriesAsync(items, async item => {

    const $set = { timestamp: cts, ...omit(item, toOmit) };
    const keys = pick(item, mergeBy);

    if (!keys.id) {
      keys.id = uuid();
    }

    const $setOnInsert = { cts };

    ids.push(keys.id);

    if (this.getNextNdoc && !$set.ndoc) {
      $setOnInsert.ndoc = await this.getNextNdoc();
    }

    return {
      updateOne: {
        filter: keys,
        update: {
          $set,
          $currentDate: { ts: true },
          $setOnInsert,
        },
        upsert: true,
      },
    };

  });

  await this.bulkWrite(ops, { ordered: false });

  return this.find({ id: { $in: ids } });

}
