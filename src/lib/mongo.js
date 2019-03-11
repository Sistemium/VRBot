import mongoose from 'mongoose';
import log from 'sistemium-telegram/services/log';

const { debug } = log('mongoose');

const mongoUrl = process.env.MONGO_URL;

if (process.env.MONGOOSE_DEBUG) {
  mongoose.set('debug', true);
}

export async function connect() {
  const connected = await mongoose.connect(`mongodb://${mongoUrl}`, {
    useNewUrlParser: true,
    useCreateIndex: true,
  });
  debug('connected', mongoUrl);
  return connected;
}

export async function disconnect() {
  debug('disconnected', mongoUrl);
  return mongoose.disconnect();
}
