import find from 'lodash/find';
import keyBy from 'lodash/keyBy';
import orderBy from 'lodash/orderBy';
import filter from 'lodash/filter';
import mapValues from 'lodash/mapValues';

import log from 'sistemium-telegram/services/log';
import { eachSeriesAsync } from 'sistemium-telegram/services/async';

import Picture from '../models/Picture';
import Baguette from '../models/Baguette';
import Article from '../models/Article';
import PictureType from '../models/PictureType';

const { debug } = log('pictures');

export async function updatePictureTypes() {

  const pictureTypes = await PictureType.find();
  const pictures = await Picture.find();

  const types = orderBy(pictureTypes, ['priority'], ['desc'])
    .map(({ id, nameRe }) => {
      const re = new RegExp(nameRe);
      return { re, id };
    });

  debug(types);

  await eachSeriesAsync(pictures, async picture => {

    const { finalName } = picture;

    const pictureType = find(types, ({ re }) => re.test(finalName));

    const type = pictureType ? pictureType.id : null;
    debug(finalName, type);

    Object.assign(picture, { type });

    await picture.save();

  });

}


export async function updateBaguettePictures() {
  return updatePictures(Baguette);
}

export async function updateArticlePictures() {
  return updatePictures(Article);
}


async function updatePictures(model) {

  const articles = await model.aggregate([{
    $lookup: {
      from: 'Picture',
      localField: 'code',
      foreignField: 'article',
      as: 'pictures',
    },
  }]);

  debug('updatePictures', articles.length, articles[0]);

  const TYPE = 'type';

  const ops = articles.map(({ _id, pictures }) => {

    const filtered = filter(pictures, TYPE);

    const $set = {
      pictures: filtered.length ? mapValues(keyBy(filtered, TYPE), 'name') : null,
    };

    return {
      updateOne: {
        filter: { _id },
        update: { $set },
      },
    };

  });

  const validOps = filter(ops);

  if (!validOps.length) {
    return { result: { nMatched: 0, nModified: 0 } };
  }

  const res = await model.bulkWrite(validOps);

  debug('updatePictures', res);

  return res;

}
