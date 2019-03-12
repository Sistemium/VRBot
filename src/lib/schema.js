import { Schema, model } from 'mongoose';
import each from 'lodash/each';
import isFunction from 'lodash/isFunction';

export default function (config) {

  const {
    collection,
    schema: schemaConfig,
    statics = {},
    indexes = [],
    onSchema,
  } = config;

  Object.assign(schemaConfig, {
    ts: Date,
    id: String,
    cts: Date,
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
    },
  });

  schema.statics = statics;

  indexes.push({ ts: -1 });
  indexes.push({ id: 1 });

  each(indexes, index => schema.index(index));

  return model(collection, schema);

}
