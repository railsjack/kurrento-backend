import mongoose from 'mongoose';
import osvEventSchema from '../schemas/osv_event.schema';

const OsvEvent = mongoose.model('osv_event', osvEventSchema);
export default OsvEvent;

