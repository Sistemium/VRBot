import model from '../lib/schema';

export default model({
  collection: 'BaguetteImage',
  schema: {

    thumbnailSrc: String,
    smallSrc: String,
    largeSrc: String,

    borderWidth: Number,

    baguetteId: String,

  },
  indexes: [
    { baguetteId: 1 },
  ],
});
