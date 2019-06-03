import { Schema, model } from 'mongoose';
import each from 'lodash/each';
import omit from 'lodash/omit';
import pick from 'lodash/pick';
import isFunction from 'lodash/isFunction';
import uuid from 'uuid/v4';

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

  const ops = items.map(item => {

    const $set = { timestamp: cts, ...omit(item, toOmit) };
    const keys = pick(item, mergeBy);

    if (!keys.id) {
      keys.id = uuid();
    }

    return {
      updateOne: {
        filter: keys,
        update: {
          $set,
          $currentDate: { ts: true },
          $setOnInsert: { cts },
        },
        upsert: true,
      },
    };

  });

  return this.bulkWrite(ops, { ordered: false });

}
