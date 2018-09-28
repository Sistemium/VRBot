import log from 'sistemium-telegram/services/log';
import { eachSeriesAsync } from '../config/async';

import * as db from '../services/redisDB';
import * as models from '../services/models';
import * as imaging from '../services/imaging';

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

/**
 * Import photos from s3 folder
 * @param {ContextMessageUpdate} ctx
 * @returns {Promise<void>}
 */

export async function importPhotos(ctx) {

  const { message: { text } } = ctx;

  debug(text);

  await ctx.replyWithChatAction('typing');
  const s3Objects = await imaging.photosToImport();
  await ctx.replyWithHTML(`Получил список файлов: <b>${s3Objects.length}</b> шт`);

  await eachSeriesAsync([s3Objects[0]], async s3Object => {

    const { Key, ETag } = s3Object;
    const id = ETag.replace(/"/g, '');
    const [, name] = Key.match(/\/([^/]+)$/);

    const existing = await db.find(models.PICTURES_KEY, id);

    if (existing) {
      debug('importPhotos already imported:', Key, ETag);
      return;
    }

    await ctx.replyWithHTML(`Пробую обработать <b>${Key}</b>`);

    await ctx.replyWithChatAction('typing');
    const source = await imaging.getS3ImageBuffer({ Key });

    await ctx.replyWithHTML(
      `Получил изображение из S3 <code>${source.length}</code> байт`,
    );

    await imaging.saveImageBuffer(ctx, source, id, { name });

  });

  debug('done');

}
