import { isValidPredicate } from '../api/predicates';
import model from '../lib/schema';

export default model({
  collection: 'Article',
  schema: {

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

    pictures: Object,

  },

  predicates: [isValidPredicate],

});
