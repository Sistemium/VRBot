import bot from 'sistemium-telegram/services/bot';
import log from 'sistemium-telegram/services/log';

import onStart from './middleware/start';
import onMessage from './middleware/message';
import { onPhoto, listPhotos } from './middleware/photo';
import { onDocument, onGetFile, listFiles } from './middleware/document';
import * as frames from './middleware/frames';

const { debug } = log('commands');

debug('configuring commands');

bot.command('start', onStart);

bot.command('files', listFiles);
bot.command('getFile', onGetFile);

bot.command('photos', listPhotos);

bot.hears(frames.SHOW_ARTICLE_COMMAND, frames.showFrame);

bot.on('document', onDocument);
bot.on('photo', onPhoto);
bot.on('message', onMessage);
