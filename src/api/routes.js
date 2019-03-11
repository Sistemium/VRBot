import Router from 'koa-router';

import { getManyHandler, getHandler } from './helpers';

import File from '../models/File';
import Picture from '../models/Picture';
import Frame from '../models/Frame';

import Article from '../models/Article';
import ArticleImage from '../models/ArticleImage';
import Baguette from '../models/Baguette';
import BaguetteImage from '../models/BaguetteImage';
import Brand from '../models/Brand';
import Colour from '../models/Colour';
import FrameSize from '../models/FrameSize';
import Material from '../models/Material';
import Surface from '../models/Surface';
import BaguetteColour from '../models/BaguetteColour';
import ArticleFrameSize from '../models/ArticleFrameSize';
import Entity from '../models/Entity';
import Screening from '../models/Screening';
import BackMount from '../models/BackMount';

const router = new Router();

[
  File,
  Picture,
  Frame,
  Article,
  Baguette,
  ArticleImage,
  BaguetteImage,
  Brand,
  Colour,
  FrameSize,
  Material,
  Surface,
  BaguetteColour,
  ArticleFrameSize,
  Entity,
  Screening,
  BackMount,
].map(defaultRoutes);

export default router;


function defaultRoutes(model) {

  const { name } = model.collection;

  router.get(`/${name}`, getManyHandler(model));
  router.get(`/${name}/:id`, getHandler(model));

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

 */
