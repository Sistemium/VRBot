import model from '../lib/schema';

export default model({
  collection: 'Baguette',
  schema: {

    id: String,

    name: String,
    code: String,
    lastName: String,
    codeExternal: String,
    nameExternal: String,
    isValid: Boolean,

    borderWidth: Number,

    materialId: String,
    brandId: String,
    colourId: String,
    surfaceId: String,

    ts: Date,
  },
});
