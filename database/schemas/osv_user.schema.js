import {Schema} from "mongoose";

const osvUserSchema = new Schema({
    user_id: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    last_logged_in_time: {
        type: Date
    },
    is_email_validated: {
        type: Boolean,
        default: false
    },
    email_validate_token: {
        type: String
    }
});

export default osvUserSchema;
