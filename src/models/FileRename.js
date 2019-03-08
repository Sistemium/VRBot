import { Schema, model } from 'mongoose';

const schema = new Schema({
  newName: String,
  oldName: String,
}, {
  collection: 'FileRename',
});

export default model('FileRename', schema);
