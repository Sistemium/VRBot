import find from 'lodash/find';
import keyBy from 'lodash/keyBy';
import orderBy from 'lodash/orderBy';
import filter from 'lodash/filter';
import mapValues from 'lodash/mapValues';

import log from 'sistemium-telegram/services/log';
import { eachSeriesAsync } from 'sistemium-telegram/services/async';

import Picture from '../models/Picture';
import Baguette from '../models/Baguette';
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

  const baguettes = await Baguette.aggregate([{
    $lookup: {
      from: 'Picture',
      localField: 'code',
      foreignField: 'article',
      as: 'pictures',
    },
  }]);

  const TYPE = 'type';

  const ops = baguettes.map(({ _id, pictures }) => {

    const filtered = filter(pictures, TYPE);

    if (!filtered.length) {
      return false;
    }

    const $set = {
      pictures: mapValues(keyBy(filtered, TYPE), 'name'),
    };

    return {
      updateOne: {
        filter: { _id },
        update: { $set },
      },
    };

  });

  const res = await Baguette.bulkWrite(filter(ops));

  debug('updateBaguettePictures', res);

  return res;

}
