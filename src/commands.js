import bot, { BOT_USER_NAME } from 'sistemium-telegram/services/bot';
import log from 'sistemium-telegram/services/log';

import onStart from './middleware/start';
import * as message from './middleware/message';
import * as photo from './middleware/photo';
import * as files from './middleware/document';
import * as frames from './middleware/frames';
import * as pictures from './middleware/pictures';
import * as chat from './middleware/chat';

const { debug } = log('commands');

debug('configuring commands');

bot.command('start', onStart);

bot.command('files', files.listFiles);
bot.command('getFile', files.onGetFile);

bot.hears(/\/importPhotos[ ]([^ ]+)[ ](\d+)/i, photo.importPhotos);
bot.hears(/\/importPhoto[ _](\d+)/i, frames.importPhoto);

bot.hears(photo.SHOW_PHOTO_COMMAND, photo.showPhoto);
bot.action(/deletePhoto#(.+)/, photo.deletePhoto);

bot.action(/downloadFile#(.+)/, files.downloadFile);
bot.action(/deleteFile#(.+)/, files.deleteFile);

bot.action(/page_(forward|back)#(.+)/, message.pageForward);

bot.command('photos', photo.listPhotos);
bot.command('syncPhotos', photo.syncSitePhotos);
bot.command('updateTypes', pictures.updateTypes);

bot.hears(frames.SHOW_ARTICLE_COMMAND, frames.showFrame);
bot.hears(files.SHOW_FILE_COMMAND, files.showFile);

bot.on('document', files.onDocument);
bot.on('photo', photo.onPhoto);

botHears('set[_ ]([^ _]+)[_ ](.+)', chat.setting);
botHears('get[ _]([a-z]+)', chat.viewSetting);

bot.on('message', message.onMessage);

function hearsRe(command) {

  return new RegExp(`^/${command}($|@${BOT_USER_NAME}$)`, 'i');

}

function botHears(command, mw) {
  bot.hears(hearsRe(command), mw);
}
