import { config } from 'aws-sdk';

const { AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY } = process.env;

if (AWS_ACCESS_KEY_ID && AWS_SECRET_ACCESS_KEY) {
  config.update({ accessKeyId: AWS_ACCESS_KEY_ID, secretAccessKey: AWS_SECRET_ACCESS_KEY });
}
