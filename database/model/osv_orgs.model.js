import mongoose from 'mongoose';
import osvOrgsSchema from '../schemas/osv_orgs.schema';

const OsvOrgs = mongoose.model('osv_orgs', osvOrgsSchema);
export default OsvOrgs;

