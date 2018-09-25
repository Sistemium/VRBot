import { S3 } from 'aws-sdk';
import log from 'sistemium-telegram/services/log';
import axios from 'axios';

const { debug, error } = log('frames');

const s3 = new S3();

const BUCKET = 'vseramki';

export function listPSD() {

  const params = {
    Bucket: BUCKET,
    MaxKeys: 5,
  };

  return new Promise((resolve, reject) => {

    s3.listObjectsV2(params, (err, data) => {
      if (err) {
        error(err.message);
        reject(err);
      } else {
        debug(JSON.stringify(data));
        resolve(data);
      }
    });

  });

}

export async function getImagebuffer(url, mime) {

  const { data } = await axios({
    method: 'get',
    responseType: 'arraybuffer',
    url,
    headers: {
      'Content-Type': mime,
    },
  });

  return data;

}
