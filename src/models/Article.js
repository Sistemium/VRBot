import model from '../lib/schema';

export default model({
  collection: 'Article',
  schema: {
    id: String,
    name: String,
    code: String,
    multiType: String,
    codeExternal: String,
    nameExternal: String,
    isValid: Boolean,
    lowPrice: Number,
    highPrice: Number,
    packageRel: Number,
    pieceWeight: Number,

    frameSizeId: String,
    baguetteId: String,
    colourId: String,
    brandId: String,
    materialId: String,
    screeningId: String,
    backMountId: String,

    ts: Date,
  },
});
