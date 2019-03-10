import Koa from 'koa';
import bodyParser from 'koa-bodyparser';
import log from 'sistemium-telegram/services/log';
import morgan from 'koa-morgan';
import * as mongo from '../models';

import api from './routes';
// import auth from './api/auth';

const { debug, error } = log('rest');
const { REST_PORT } = process.env;

const app = new Koa();

api.prefix('/api');

debug('starting on port', REST_PORT);

mongo.connect()
  .then(mongoose => {
    const { connection: { db: { databaseName } } } = mongoose;
    debug('mongo connected:', databaseName);
  })
  .catch(e => error('mongo connect error', e.message));

app
  .use(morgan(':status :method :url :res[content-length] - :response-time ms'))
  // .use(auth)
  .use(bodyParser())
  .use(api.routes())
  .use(api.allowedMethods())
  .listen(REST_PORT);

process.on('SIGINT', () => {
  cleanup().then(debug, error);
});


async function cleanup() {

  error('cleanup');

  await mongo.disconnect()
    .catch(error);

  process.exit();

}

/*
vr.Article.js
vr.ArticleFrameSize.js
vr.ArticleImage.js
vr.BackMount.js
vr.Baguette.js
vr.BaguetteColour.js
vr.BaguetteImage.js
vr.Brand.js
vr.Colour.js
vr.Entity.js
vr.FrameSize.js
vr.Manufacturer.js
vr.Material.js
vr.PassePartout.js
vr.SaleOrder.js
vr.SaleOrderPosition.js
vr.Screening.js
vr.Surface.js
vr.User.js
[
    "Article",
    "ArticleImage",
    "BackMount",
    "Baguette",
    BaguetteColour
    "BaguetteImage",
    Brand
    Colour
    Entity
    "File",
    "FileRename",
    "Frame",
    "FrameSize",
    Manufacturer
    "Material",
    PassePartout
    "Picture",
    "counters",
    "system.js"
]
 */
