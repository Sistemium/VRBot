import bot from 'sistemium-telegram/services/bot';
import start from './middleware/start';

bot.command('start', start);
