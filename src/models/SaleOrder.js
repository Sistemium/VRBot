import get from 'lodash/get';
import model from '../lib/schema';

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
    ndoc: 'id',

    creatorId: String,

  },

  predicates: [authorPredicate],

});

function authorPredicate({ state, params }) {

  const roles = get(state, 'auth.roles') || {};
  const creatorId = get(state, 'auth.account.id');
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
