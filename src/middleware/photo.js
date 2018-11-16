import log from 'sistemium-telegram/services/log';
import take from 'lodash/take';
import map from 'lodash/map';
import find from 'lodash/find';
import filter from 'lodash/filter';
import sortBy from 'lodash/sortBy';
import Markup from 'telegraf/markup';

import * as async from 'sistemium-telegram/services/async';

import * as db from '../services/redisDB';
import * as models from '../services/models';
import * as imaging from '../services/imaging';
import api from '../services/siteApi';

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

const thumbnailsURL = 'https://s3-eu-west-1.amazonaws.com/vseramki/thumbnails';
const largesURL = 'https://s3-eu-west-1.amazonaws.com/vseramki/large';

export async function syncSitePhotos(ctx) {

  const pictures = await db.findAll(models.PICTURES_KEY);

  debug('syncSitePhotos got pictures', pictures.length);

  const baguettePictures = sortBy(filter(pictures, isBaguettePicture), 'article');

  const baguetteImages = await api.get('BaguetteImage');
  debug('syncSitePhotos got baguetteImages', baguetteImages.length);

  const baguettes = await api.get('Baguette');
  debug('syncSitePhotos got baguettes', baguettes.length);

  const toInsert = filter(baguettePictures.map(picture => {
    const { article, name, refId } = picture;

    const baguette = find(baguettes, { code: article });

    if (!baguette) {
      // debug('syncSitePhotos', 'not found for', article);
      return false;
    }

    debug('syncSitePhotos', 'found baguette', refId, `"${article}"`, name);

    const thumbnailSrc = `${thumbnailsURL}/${name}`;
    const existingImage = find(baguetteImages, { thumbnailSrc });

    if (existingImage) {
      return false;
    }

    const largeSrc = `${largesURL}/${name}`;

    return {
      largeSrc,
      thumbnailSrc,
      smallSrc: largeSrc,
      baguetteId: baguette.id,
    };

  }));

  await ctx.replyWithChatAction('upload_document');

  await async.eachSeriesAsync(
    toInsert,
    async baguetteImage => {
      const { id } = await api.post('BaguetteImage', baguetteImage);
      debug('syncSitePhotos uploaded BaguetteImage', id);
    },
  );

  const reply = [
    JSON.stringify(toInsert[0], null, 2),
    `To insert: <b>${toInsert.length}</b>`,
    `of: <b>${baguettePictures.length}</b>`,
  ];

  await ctx.replyWithHTML(reply.join(' '));

}

function isBaguettePicture(picture) {
  return /багет\.[^.]/i.test(picture.name);
}

export const SHOW_PHOTO_COMMAND = /^\/p_([x]?\d+)[ ]?([a-z]+)?/;

// function photoKey({ refId }) {
//   return `/p_${refId}`;
// }


/**
 * Show a file info
 * @param {ContextMessageUpdate} ctx
 * @returns {Promise<void>}
 */

export async function showPhoto(ctx) {

  const { match } = ctx;
  const [command, refId, format] = match;

  debug(command, refId, format);

  const item = await db.findByRefId(models.PICTURES_KEY, refId);

  if (!item) {
    await ctx.replyWithHTML(`Не нашел картинки с номером <code>${refId}</code>`);
    return;
  }

  if (format === 'plain') {
    await ctx.reply(`${JSON.stringify(item, null, 2)}`);
    return;
  }

  const reply = photoView(item);
  const keyBoard = Markup.inlineKeyboard([
    Markup.callbackButton('️Удалить', `deletePhoto#${item.id}`),
  ]);

  // debug(JSON.stringify(keyBoard));
  await ctx.replyWithHTML(reply.join('\n'), keyBoard.extra());
  await ctx.replyWithPhoto(item.images[0].file_id);

}

function photoView(file) {
  return map(file, (val, key) => {
    const res = [`${key}:`];
    if (Array.isArray(val)) {
      // res.push(...val.map(f => `\n<code>${JSON.stringify(f)}</code>`));
      res.push(' ', val.length, 'шт.');
    } else {
      res.push(` <code>${JSON.stringify(val)}</code>`);
    }
    return res.join('');
  });
}

/**
 * Action handler to delete a photo
 * @param {ContextMessageUpdate} ctx
 * @returns {Promise<void>}
 */

export async function deletePhoto(ctx) {

  const { match, callbackQuery } = ctx;
  const [action, fileId] = match;

  debug(action, fileId);
  // debug(JSON.stringify(callbackQuery));

  const file = await db.find(models.PICTURES_KEY, fileId);

  await ctx.deleteMessage(callbackQuery.message_id);

  if (!file) {
    await ctx.answerCbQuery('Картинка уже удалена');
    return;
  }

  await db.destroy(models.PICTURES_KEY, fileId);

  await ctx.replyWithHTML(`Удалил картинку №${file.refId} <b>${file.name}</b>`);

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
