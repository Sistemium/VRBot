import find from 'lodash/find';
// import take from 'lodash/take';
import orderBy from 'lodash/orderBy';

import log from 'sistemium-telegram/services/log';
import { eachSeriesAsync } from 'sistemium-telegram/services/async';

import Picture from '../models/Picture';
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
