import lo from 'lodash';
import log from 'sistemium-telegram/services/log';
import Chat from '../models/Chat';

const { debug } = log('chat');

const SETTING_NAMES = ['notifySaleOrder'];

export async function setting(ctx) {

  const { chat, match: [, name, onOff] } = ctx;

  if (await ifNotPermitted(ctx)) {
    return;
  }

  if (await ifInvalidSetting(ctx, name)) {
    return;
  }

  const value = /^(on|true|1)$/.test(onOff);
  await Chat.saveValue(chat.id, name, value);
  await ctx.replyWithHTML(settingView(chat.id, name, 'from now on is', value));

}


export async function viewSetting(ctx) {

  const { chat, match: [, name] } = ctx;

  if (await ifNotPermitted(ctx)) {
    return;
  }

  if (await ifInvalidSetting(ctx, name)) {
    return;
  }

  const value = await Chat.findValue(chat.id, name);
  await ctx.replyWithHTML(settingView(chat.id, name, 'is', value));

}


function settingView(chatId, name, action, value) {
  debug('settingView', chatId, name, action, value);
  return [
    'Setting',
    `<b>${name}</b> ${action} <b>${value}</b>`,
    'for chat id',
    `<code>${chatId}</code>`,
  ].join(' ');
}


async function ifInvalidSetting(ctx, name) {
  if (SETTING_NAMES.includes(name)) {
    return false;
  }
  await ctx.replyWithHTML(`⚠ Invalid setting <b>${name}</b>`);
  return true;
}

async function ifNotPermitted(ctx) {

  const { chat, from } = ctx;

  if (chat.id === from.id) {
    return false;
  }

  const admins = await ctx.telegram.getChatAdministrators(chat.id);
  if (!lo.find(admins, { id: from.id })) {
    return false;
  }

  const notAuthorized = [
    `⚠ <b>${from.first_name}</b> may not do setting in chat id <code>${chat.id}</code>`,
  ];

  await ctx.replyWithHTML(notAuthorized.join(' '));
  return true;

}
