import mongoose from 'mongoose';
import osvOrgStaffSchema from '../schemas/osv_org_staff.schema';

const OsvOrgStaff = mongoose.model('osv_org_staff', osvOrgStaffSchema);
export default OsvOrgStaff;

