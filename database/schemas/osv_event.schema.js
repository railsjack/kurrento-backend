import {Schema} from "mongoose";

const osvEventSchema = new Schema({
    event_id: {
        type: String
    },
    org_id: {
        type: String
    },
    name: {
        type: String
    },
    bg_image: {
        type: String
    }
    default_video_watermark: {
        type: String
    }
});

export default osvEventSchema;
