import log from 'sistemium-telegram/services/log';
import take from 'lodash/take';

import * as async from 'sistemium-telegram/services/async';

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

  const { match: [text, param] } = ctx;
  const limit = parseInt(param, 0) || 5;

  debug(text);

  await ctx.replyWithHTML('Получаю список файлов в S3');
  await ctx.replyWithChatAction('typing');

  const s3Objects = await imaging.photosToImport();
  await ctx.replyWithHTML(`Получил список файлов: <b>${s3Objects.length}</b> шт`);

  const unprocessed = await async.filterSeriesAsync(s3Objects, processedImageFilter);

  await ctx.replyWithHTML([
    `Из них необработано: <b>${unprocessed.length}</b> шт.`,
    `Попробую обработать <b>${limit < unprocessed.length ? limit : 'все'}</b>`,
  ].join(' '));

  const objectsToProcess = take(unprocessed, limit);
  let processedCount = 0;

  await async.eachSeriesAsync(objectsToProcess, async s3Object => {

    const { Key, ETag } = s3Object;
    const id = idFromETag(ETag);
    const [, name] = Key.match(/\/([^/]+)$/);

    await ctx.replyWithHTML(`Пробую обработать <b>${Key}</b>`);

    await ctx.replyWithChatAction('typing');
    const source = await imaging.getS3ImageBuffer({ Key });

    await ctx.replyWithHTML([
      `Получил изображение <code>№${processedCount + 1}</code>`,
      `<code>${source.length}</code> байт`,
    ].join(' '));

    await imaging.saveImageBuffer(ctx, source, id, { name });

    await ctx.replyWithChatAction('typing');

    processedCount += 1;

  });

  await ctx.replyWithHTML(
    `Успешно обработано изображений: <code>${processedCount}</code> шт.`,
  );

  async function processedImageFilter(s3Object) {

    const { Key, ETag } = s3Object;
    const id = idFromETag(ETag);
    const existing = await db.find(models.PICTURES_KEY, id);

    if (existing) {
      debug('importPhotos already imported:', Key, ETag);
      return false;
    }

    return true;

  }

}


function idFromETag(ETag) {
  return ETag.replace(/"/g, '');
}
