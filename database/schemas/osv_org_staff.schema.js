import {Schema} from "mongoose";

const osvOrgStaffSchema = new Schema({
    user_id: {
        type: String,
        required: true,
    },
    org_id: {
        type: String,
        required: true
    },
    role: {
        type: String,
        required: true,
    },
    last_login_time: {
        type: Date,
        default: new Date()
    }
});

export default osvOrgStaffSchema;
