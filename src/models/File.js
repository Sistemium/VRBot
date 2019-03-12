import { getId } from 'sistemium-telegram/services/redis';
import mongoose from '../lib/schema';

const FILES_KEY = 'files';

const collection = 'File';

const schema = {
  id: String,
  refId: Number,
  file_name: String,
  mime_type: String,
  thumb: Object,
  file_id: String,
  file_size: Number,
  ts: Date,
};

function onSchema(s) {
  s.pre('save', async function setDefaultRef() {
    if (!this.refId) {
      this.refId = await getId(FILES_KEY);
    }
  });
}

export default mongoose({ collection, schema, onSchema });
