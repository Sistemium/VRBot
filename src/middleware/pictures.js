import * as pictures from '../services/pictures';

export async function updateTypes(ctx) {

  await ctx.replyWithChatAction('typing');

  await pictures.updatePictureTypes();

  await ctx.replyWithHTML('Обновил типы картинок, обновляю багеты ...');

  await ctx.replyWithChatAction('typing');

  const { result } = await pictures.updateBaguettePictures();

  const baguetteResponse = `Обновил ${result.nModified} из ${result.nMatched} багетов`;

  await ctx.replyWithHTML(baguetteResponse);

}
