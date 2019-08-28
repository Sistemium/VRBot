import get from 'lodash/get';
import { getId } from 'sistemium-telegram/services/redis';
import model from '../lib/schema';

const SALE_ORDER_NUMBER = 'sale_order_ndoc';

export default model({

  collection: 'SaleOrder',

  schema: {

    shipDate: String,
    comment: String,
    contactName: String,
    email: String,
    phone: String,
    shipTo: String,
    processing: String,
    ndoc: String,

    creatorId: String,

  },

  predicates: [authorPredicate],

  statics: {
    getNextNdoc,
  },

});

function authorPredicate({ state, params }) {

  const roles = get(state, 'auth.roles') || {};
  const creatorId = get(state, 'auth.account.id') || '';
  const { admin, manager } = roles;

  if (admin || manager) {
    return null;
  }

  // Allow read by id
  if (params.id) {
    return null;
  }

  return { creatorId };

}

function getNextNdoc() {
  return getId(SALE_ORDER_NUMBER);
}
