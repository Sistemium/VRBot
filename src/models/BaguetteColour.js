import model from '../lib/schema';

export default model({
  collection: 'BaguetteColour',
  schema: {
    baguetteId: String,
    colourId: String,
  },
});
