import { Schema, model } from 'mongoose';
import log from 'sistemium-telegram/services/log';

const { debug } = log('Picture');

const schema = new Schema({

  ts: Date,
  id: String,
  cts: Date,

  refId: Number,
  article: String,
  name: String,
  renamed: String,
  images: Array,
  type: String,
  folder: String,

}, {
  collection: 'Picture',
});

schema.virtual('finalName')
  .get(finalName);

Object.assign(schema.statics, { setComputed });

export default model('Picture', schema);

export const PICTURES_KEY = 'pictures';

export function setComputed() {
  const name = finalName.call(this);
  const [, article] = name.match(/([^_.]+).+(png|tif[f]?|jp[e]?g)$/i) || [];
  this.article = article || null;
  debug(JSON.stringify(this));
}


function finalName() {
  return this.renamed || this.name;
}
