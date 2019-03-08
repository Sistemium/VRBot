import { S3 } from 'aws-sdk';
import log from 'sistemium-telegram/services/log';
import axios from 'axios';
import { whilstAsync } from 'sistemium-telegram/services/async';
import sharp from 'sharp';
import filter from 'lodash/filter';
import { getId } from 'sistemium-telegram/services/redis';

import Picture, { PICTURES_KEY } from '../models/Picture';

const { debug } = log('frames');

const s3 = new S3();

const BUCKET = 'vseramki';

export async function photosToImport() {

  const params = {
    Bucket: BUCKET,
    MaxKeys: 600,
    Prefix: 'import/',
  };

  return new Promise(async (resolve, reject) => {

    let req = s3.listObjects(params);
    let pageNumber = 1;

    try {

      const { Contents: result } = await req.promise();

      await whilstAsync(
        () => req.response.hasNextPage(),
        async () => {
          pageNumber += 1;
          debug('got page', pageNumber);
          req = req.response.nextPage();
          const { Contents: nextPageData } = await req.promise();
          result.push(...nextPageData);
        },
      );

      resolve(filter(result, 'Size'));

    } catch (e) {
      reject(e);
    }

  });

}

export async function getImageBuffer(url, mime) {

  const { data } = await axios({
    method: 'get',
    responseType: 'arraybuffer',
    url,
    headers: {
      'Content-Type': mime,
    },
  });

  return data;

}

export async function getS3ImageBuffer({ Key }) {

  const params = {
    Bucket: BUCKET,
    Key,
  };

  const res = await s3.getObject(params).promise();

  // debug(Object.keys(res.Body));

  return Buffer.from(res.Body);

}

export async function imageMetadata(image) {

  return sharp(image)
    .metadata();

}


export async function streamMetadata(readableStream) {

  return new Promise((resolve, reject) => {

    try {
      const transformer = sharp()
        .metadata(resolve);
      readableStream.pipe(transformer);
    } catch (e) {
      reject(e);
    }

  });

}

const THUMB_SIZE = 150;
const SMALL_SIZE = 350;
const LARGE_SIZE = 2000;

export async function saveImageBufferToS3(buffer, nameOriginal) {

  const name = nameOriginal.replace(/\.[^.]+$/, '.png');
  const img = sharp(Buffer.from(buffer))
    .trim()
    .background('#ffffff')
    .flatten();

  /*
  Thumb
   */

  const thumbnail = img.clone()
    .resize(THUMB_SIZE, THUMB_SIZE).max()
    .png();

  let Body = await thumbnail.toBuffer();

  debug('saveImageBufferToS3 thumbnail size:', Body.length);

  await uploadBufferToS3Key({
    Body,
    Key: `thumbnails/${name}`,
    ContentType: 'image/png',
  });

  /*
  Small
   */

  const small = img.clone()
    .resize(SMALL_SIZE, SMALL_SIZE).max()
    .png();

  Body = await small.toBuffer();

  debug('saveImageBufferToS3 small size:', Body.length);

  await uploadBufferToS3Key({
    Body,
    Key: `small/${name}`,
    ContentType: 'image/png',
  });

  /*
  Large
   */

  const large = img.resize(LARGE_SIZE, LARGE_SIZE).max()
    .png();

  Body = await large.toBuffer();

  debug('saveImageBufferToS3 large size:', Body.length);

  await uploadBufferToS3Key({
    Body,
    Key: `large/${name}`,
    ContentType: 'image/png',
  });

  return Body;

}


function uploadBufferToS3Key({ Body, Key, ContentType }) {

  const params = {
    Bucket: BUCKET,
    Key,
    Body,
    ContentType,
  };

  return s3.upload(params).promise();

}

export async function saveImageBuffer(ctx, source, id, props) {

  const { name } = props;
  const [, article] = name.match(/([^_.]+).+(png|tif[f]?|jp[e]?g)$/i);
  const picture = new Picture({ article, ...props, id });

  await ctx.replyWithChatAction('upload_photo');

  debug('saveImageBuffer:', name, article, source.length);

  const onS3Large = await saveImageBufferToS3(source, name);

  // await ctx.reply(JSON.stringify(onS3, null, 2));

  const msg = await ctx.replyWithPhoto({ source: onS3Large });

  picture.images = msg.photo;
  picture.id = id;
  picture.refId = await getId(PICTURES_KEY);

  await picture.save();

  const reply = `Запомнил картинку /p_${picture.refId} с артикулом <b>${article}</b>`;
  await ctx.replyWithHTML(reply);

}
