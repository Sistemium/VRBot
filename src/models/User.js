import get from 'lodash/get';
import model from '../lib/schema';

export default model({

  collection: 'User',

  schema: {
    name: String,
    phone: String,
    email: String,
    address: String,
  },

  predicates: [authorPredicate],

});

function authorPredicate({ state }) {

  const creatorId = get(state, 'auth.account.id') || '';

  return { id: creatorId };

}
