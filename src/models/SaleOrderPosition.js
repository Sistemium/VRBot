import model from '../lib/schema';

export default model({

  collection: 'SaleOrderPosition',

  schema: {

    count: Number,
    price: Number,
    priceOrigin: Number,

    articleId: String,
    saleOrderId: String,

  },

});
