import mongoose from 'mongoose';
import osvUserSchema from '../schemas/osv_user.schema';

const OsvUser = mongoose.model('osv_user', osvUserSchema);
export default OsvUser;
  
