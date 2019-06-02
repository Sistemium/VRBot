import Router from 'koa-router';

import { getManyHandler, getHandler } from './helpers';
import models from './models';

const router = new Router();

models.map(defaultRoutes);

export default router;

function defaultRoutes(model) {

  const { name } = model.collection;

  router.get(`/${name}`, getManyHandler(model));
  router.get(`/${name}/:id`, getHandler(model));

}
