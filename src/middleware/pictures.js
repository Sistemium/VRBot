import { updatePictureTypes } from '../services/pictures';

export async function updateTypes(ctx) {

  await ctx.replyWithChatAction('typing');

  await updatePictureTypes();

  await ctx.replyWithHTML('Done');

}
