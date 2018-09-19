import trim from 'lodash/trim';

/**
 * Start command handler
 * @param {ContextMessageUpdate} ctx
 * @returns {Promise<void>}
 */

export default async function (ctx) {

  await ctx.replyWithHTML(`Здравствуй, <b>${name(ctx.from)}</b>!`);

}


function name({ first_name: firstName, last_name: lastName }) {
  return trim([firstName, lastName].join(' '));
}
