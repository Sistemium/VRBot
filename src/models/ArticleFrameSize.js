import model from '../lib/schema';

export default model({
  collection: 'ArticleFrameSize',
  schema: {
    articleId: String,
    frameSizeId: String,
  },
});
