import {Schema} from "mongoose";

const osvUserOauthLinkSchema = new Schema({
    user_id: {
        type: String,
        required: true,
        unique: true
    },
    oauth_type: {
        type: String,
        required: true
    },
    oauth_token: {
        type: String,
        required: true
    }
});

export default osvUserOauthLinkSchema;
