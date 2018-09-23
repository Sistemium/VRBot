import log from 'sistemium-telegram/services/log';

const { debug } = log('photo');

/**
 * Picture upload handler
 * @param {ContextMessageUpdate} ctx
 * @returns {Promise<void>}
 */

export async function onPhoto(ctx) {

  const { message: { photo } } = ctx;

  debug('onPhoto', JSON.stringify(photo));

  await ctx.replyWithHTML(
    'Получил картинку, но мне нужно, чтобы ты ее как файл отправил, иначе я артикул не увижу!',
  );

}

export async function listPhotos(ctx) {

  debug('listPhotos');

  await ctx.replyWithHTML('Понял, что нужно показать список картинок, но пока не умею этого');

}
