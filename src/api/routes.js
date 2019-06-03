import Router from 'koa-router';

import * as h from './helpers';
import models from './models';

const router = new Router();

models.map(defaultRoutes);

export default router;

function defaultRoutes(model) {

  const { name } = model.collection;

  router
    .get(`/${name}`, h.getManyHandler(model))
    .get(`/${name}/:id`, h.getHandler(model))
    .post(`/${name}`, h.postHandler(model))
    .put(`/${name}/:id`, h.putHandler(model))
    .put(`/${name}`, h.putHandler(model))
    .del(`/${name}/:id`, h.delHandler(model));

}
