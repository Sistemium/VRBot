import Router from 'koa-router';

import { getManyHandler, getHandler } from './helpers';

import File from '../models/File';
import Picture from '../models/Picture';
import Frame from '../models/Frame';
import Article from '../models/Article';

const router = new Router();

[File, Picture, Frame, Article].map(defaultRoutes);

export default router;


function defaultRoutes(model) {

  const { name } = model.collection;

  router.get(`/${name}`, getManyHandler(model));
  router.get(`/${name}/:id`, getHandler(model));

}
