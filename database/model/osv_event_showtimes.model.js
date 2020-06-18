import mongoose from 'mongoose';
import osvEventShowtimsSchema from '../schemas/osv_event_showtimes.schema';

const OsvEventShowtimes = mongoose.model('osv_event_showtimes', osvEventShowtimsSchema);
export default OsvEventShowtimes;

