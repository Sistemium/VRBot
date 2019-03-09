import { Schema, model } from 'mongoose';

const MODEL = 'File';

const schema = new Schema({
  id: String,
  refId: Number,
  file_name: String,
  mime_type: String,
  thumb: Object,
  file_id: String,
  file_size: Number,
  ts: Date,
}, {
  collection: MODEL,
});

export default model(MODEL, schema);

/*
{
    "_id" : ObjectId("5c83950b6110edd71e8c44b2"),
    "refId" : 2,
    "file_name" : "5041-L.png",
    "mime_type" : "image/png",
    "thumb" : {
        "file_id" : "AAQEABNOu8EaAARjkVl2bqOZe32OAAIC",
        "file_size" : 3184,
        "width" : 90,
        "height" : 90
    },
    "file_id" : "BQADBAADWgQAAgJPuFM_HNYJmOMY6wI",
    "file_size" : 2935121,
    "id" : "AAQEABNOu8EaAARjkVl2bqOZe32OAAIC",
    "ts" : "2018-11-22T17:43:06.460Z"
}
*/
