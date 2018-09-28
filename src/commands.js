import bot from 'sistemium-telegram/services/bot';
import log from 'sistemium-telegram/services/log';

import onStart from './middleware/start';
import * as message from './middleware/message';
import * as photo from './middleware/photo';
import * as files from './middleware/document';
import * as frames from './middleware/frames';

const { debug } = log('commands');

debug('configuring commands');

bot.command('start', onStart);

bot.command('files', files.listFiles);
bot.command('getFile', files.onGetFile);

bot.command('importPhotos', photo.importPhotos);
bot.hears(/\/importPhoto[ _](\d+)/i, frames.importPhoto);

bot.action(/download#(.+)/, files.downloadFile);
bot.action(/deleteFile#(.+)/, files.deleteFile);

bot.action(/page_(forward|back)#(.+)/, message.pageForward);

bot.command('photos', photo.listPhotos);

bot.hears(frames.SHOW_ARTICLE_COMMAND, frames.showFrame);
bot.hears(files.SHOW_FILE_COMMAND, files.showFile);

bot.on('document', files.onDocument);
bot.on('photo', photo.onPhoto);
bot.on('message', message.onMessage);
