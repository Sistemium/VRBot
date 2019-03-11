import model from '../lib/schema';

export default model({
  collection: 'FrameSize',
  schema: {
    name: String,
    width: Number,
    height: Number,
    isoCode: String,
  },
});
