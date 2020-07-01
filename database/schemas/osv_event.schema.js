import {Schema} from "mongoose";

const osvEventSchema = new Schema({
    event_id: {
        type: String
    },
    user_id: {
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
    },
    default_video_watermark: {
        type: String
    },
    watermark_position:{
        type: Number,
        default: 1
    },
    layout_type:{
        type: Number,
        default: 1
    }
});

export default osvEventSchema;
