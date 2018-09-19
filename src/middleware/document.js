import log from 'sistemium-telegram/services/log';
import bot from 'sistemium-telegram/services/bot';

const { debug } = log('document');

/**
 * Document upload handler
 * @param {ContextMessageUpdate} ctx
 * @returns {Promise<void>}
 */

export default async function (ctx) {

  const { message } = ctx;

  debug('onDocument', JSON.stringify(message));

}


/**
 * Get file info test command
 * @param {ContextMessageUpdate} ctx
 * @returns {Promise<void>}
 */

export async function onGetFile(ctx) {

  const { message: { text } } = ctx;

  const [, fileId] = text.match(/[ ](.+)$/);

  debug('onGetFile', fileId);

  const link = await bot.telegram.getFileLink(fileId);

  await ctx.reply(link);

}
