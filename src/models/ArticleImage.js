import model from '../lib/schema';

export default model({
  collection: 'ArticleImage',
  schema: {

    thumbnailSrc: String,
    smallSrc: String,
    largeSrc: String,

    borderWidth: Number,

    articleId: String,

  },
  indexes: [
    { articleId: 1 },
  ],
});
