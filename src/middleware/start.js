import trim from 'lodash/trim';

/**
 * Start command handler
 * @param {ContextMessageUpdate} ctx
 * @returns {Promise<void>}
 */

export default async function (ctx) {

  const reply = [
    `Здравствуй, <b>${name(ctx.from)}</b>!`,
    '\nЯ бот - компьютерная программа-помощник для пользователей сайта всерамки.рф.',
    '\nТы можешь мне написать мне что-то, а я поищу подходящие рамки и багеты.',
  ];

  await ctx.replyWithHTML(reply.join('\n'));

}


function name({ first_name: firstName, last_name: lastName }) {
  return trim([firstName, lastName].join(' '));
}
