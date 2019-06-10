import model from '../lib/schema';

export default model({
  collection: 'PictureType',
  schema: {
    name: String,
    nameRe: String,
    priority: Number,
  },
});
