import * as pictures from '../services/pictures';

export async function updateTypes(ctx) {

  await ctx.replyWithChatAction('typing');

  await pictures.updatePictureTypes();

  await ctx.replyWithHTML('Обновил типы картинок, обновляю багеты ...');

  await ctx.replyWithChatAction('typing');

  const { result: bResult } = await pictures.updateBaguettePictures();

  const baguetteResponse = `Обновил ${bResult.nModified || 0} из ${bResult.nMatched || 0} багетов`;

  await ctx.replyWithHTML(baguetteResponse);

  const { result: aResult } = await pictures.updateArticlePictures();

  const articleResponse = `Обновил ${aResult.nModified || 0} из ${aResult.nMatched || 0} рамок`;

  await ctx.replyWithHTML(articleResponse);

}
