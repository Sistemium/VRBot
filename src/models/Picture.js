import { Schema, model } from 'mongoose';

const schema = new Schema({
  id: String,
  refId: Number,
  article: String,
  name: String,
  images: Array,
  ts: Date,
}, {
  collection: 'Picture',
});

export default model('Picture', schema);

export const PICTURES_KEY = 'pictures';
