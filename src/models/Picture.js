import { Schema, model } from 'mongoose';

const schema = new Schema({

  refId: Number,
  article: String,
  name: String,
  renamed: String,
  images: Array,
  type: String,

}, {
  collection: 'Picture',
});

schema.virtual('finalName')
  .get(function finalName() {
    return this.renamed || this.name;
  });

export default model('Picture', schema);

export const PICTURES_KEY = 'pictures';
