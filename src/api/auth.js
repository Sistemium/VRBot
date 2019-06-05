import { roles as getRoles } from 'sistemium-telegram/services/auth';
import log from 'sistemium-telegram/services/log';
import { setAsync, getAsync } from 'sistemium-telegram/services/redis';

const { debug, error } = log('api');

const AUTH_EXPIRE = parseInt(process.env.AUTH_EXPIRE, 0) || 300;

export default async function (ctx, next) {

  const { header: { authorization }, state, assert } = ctx;

  if (!authorization || authorization === 'null') {
    await next();
    return;
  }

  try {

    const auth = await cachedAuth(authorization);

    assert(auth, 401);

    const { account, roles } = auth;

    debug('authorized:', `"${account.name}"`);
    state.auth = { account, roles };

  } catch (e) {
    error('auth:', e.message);
    await saveAuth(authorization, false);
    ctx.throw(401);
  }

  await next();

}

async function cachedAuth(authorization) {

  const cached = await getAsync(authorization);

  if (cached) {
    return JSON.parse(cached);
  }

  const auth = await getRoles(authorization);

  if (auth.roles && auth.account) {
    await saveAuth(authorization, auth);
  }

  return auth;

}


async function saveAuth(authorization, auth) {
  const saved = await setAsync(authorization, JSON.stringify(auth), 'EX', AUTH_EXPIRE);
  debug('savedAuth', authorization, saved);
}
