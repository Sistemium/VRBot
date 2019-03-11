import { Schema, model } from 'mongoose';
import each from 'lodash/each';

export default function (config) {

  const {
    collection,
    schema: schemaConfig,
    statics = {},
    indexes = [],
  } = config;

  Object.assign(schemaConfig, {
    ts: Date,
    id: String,
  });

  const schema = new Schema(schemaConfig, { collection });

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
