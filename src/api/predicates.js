import get from 'lodash/get';

export function isValidPredicate({ state }) {

  const roles = get(state, 'auth.roles') || {};
  const { admin, manager } = roles;

  if (admin || manager) {
    return null;
  }

  return { isValid: true };

}
