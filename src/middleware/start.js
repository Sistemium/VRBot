import trim from 'lodash/trim';

/**
 * Start command handler
 * @param {ContextMessageUpdate} ctx
 * @returns {Promise<void>}
 */

export default async function (ctx) {

  const reply = [
    `Здравствуй, <b>${name(ctx.from)}</b>!`,
    '\n\nЯ бот - компьютерная программа-помощник для пользователей сайта всерамки.рф.',
    '\n\nТы можешь мне написать мне что-то, а я поищу подходящие рамки и багеты.',
    ' Например, <b>сосна</b> или <b>30*40</b> или <b>22РП1015</b>',
  ];

  await ctx.replyWithHTML(reply.join(''), { reply_markup: { remove_keyboard: true } });

}


function name({ first_name: firstName, last_name: lastName }) {
  return trim([firstName, lastName].join(' '));
}
