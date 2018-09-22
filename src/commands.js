import bot from 'sistemium-telegram/services/bot';
import log from 'sistemium-telegram/services/log';

import onStart from './middleware/start';
import onMessage from './middleware/message';
import { onDocument, onGetFile } from './middleware/document';
import { showFrame } from './middleware/frames';

const { debug } = log('commands');

debug('configuring commands');

bot.command('start', onStart);

bot.on('document', onDocument);
bot.command('getFile', onGetFile);

bot.hears(/^\/f_([x]?\d+)/, showFrame);

bot.on('message', onMessage);
