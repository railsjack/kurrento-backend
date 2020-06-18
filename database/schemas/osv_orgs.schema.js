import {Schema} from "mongoose";

const osvOrgsSchema = new Schema({
    org_id: {
        type: String,
        required: true,
        unique: true
    },
    owner_user_id: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true,
    },
    logo_url: {
        type: String
    },
    bg_images: {
        type: Array,
        default: []
    },
    created_at: {
        type: Date
    }
});

export default osvOrgsSchema;
