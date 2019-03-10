import { roles as getRoles } from 'sistemium-telegram/services/auth';
import log from 'sistemium-telegram/services/log';

const { debug, error } = log('api');

export default async function (ctx, next) {

  const { header: { authorization }, assert, state } = ctx;

  assert(authorization, 401);

  try {

    const { account, roles } = await getRoles(authorization);
    // const { site, [REQUIRED_ROLE]: hasAuth } = roles;
    //
    // if (!hasAuth) {
    //   ctx.throw(403);
    // }

    debug('authorized:', `"${account.name}"`);
    state.auth = { account, roles };

  } catch (e) {
    error('auth:', e.message);
    ctx.throw(401);
  }

  await next();

}
