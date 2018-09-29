import log from 'sistemium-telegram/services/log';
import { config } from 'aws-sdk';

const { debug } = log('config:aws');

const { AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY } = process.env;

if (AWS_ACCESS_KEY_ID && AWS_SECRET_ACCESS_KEY) {
  config.update({
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY,
    region: 'eu-west-1',
  });
}

debug('did configured with AWS_ACCESS_KEY_ID:', AWS_ACCESS_KEY_ID);
