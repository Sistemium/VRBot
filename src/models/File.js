import mongoose from '../lib/schema';

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

export default mongoose({ collection, schema });
