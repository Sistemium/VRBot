import { roles as getRoles } from 'sistemium-telegram/services/auth';
import log from 'sistemium-telegram/services/log';

const { debug, error } = log('api');

export default async function (ctx, next) {

  const { header: { authorization }, state } = ctx;

  if (!authorization) {
    await next();
    return;
  }

  try {

    const { account, roles } = await getRoles(authorization);

    debug('authorized:', `"${account.name}"`);
    state.auth = { account, roles };

  } catch (e) {
    error('auth:', e.message);
    ctx.throw(401);
  }

  await next();

}
